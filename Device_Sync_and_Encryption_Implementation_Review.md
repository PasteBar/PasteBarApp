# Device Sync and Encryption Implementation Review

I have completed the review of the implementation based on the plan in `docs\plans\2026-02-26-device-sync-and-encryption.md` and investigated the issues reported:

1. **Pings work in only one direction and disconnect sometime**
2. **History sync does not work from or to any devices**

## Findings

The core issue stems from a significant architectural deviation from the original plan. The plan specified:
> "cursor-based transport over QUIC/mDNS"

However, the current implementation relies entirely on **stateless UDP Broadcasts** for all networking, including bulk data transfer (History Sync) and Pings.

### 1. Ping Directionality Issue (One-Way Pings)
**Root Cause:** The `ping_trusted_peers` function broadcasts packets to `255.255.255.255` and all subnet broadcast addresses. 
On systems with multiple network interfaces (e.g., Windows with Wi-Fi, Ethernet, VirtualBox Host-Only adapters, Docker NAT), the OS routing table forces the `255.255.255.255` broadcast out of a single default interface (often the wrong virtual adapter instead of Wi-Fi/LAN).
- **Device A** broadcasts Ping out the wrong adapter. **Device B** never receives it.
- **Device B**'s broadcast routing works, so **Device A** receives B's ping. 
- Because **Device A** replies via a direct unicast `send_to` using B's `source_addr`, the Pong routes back successfully. Thus, ping only works B -> A.

### 2. Random Disconnects ("Timeout / No Pong")
**Root Cause:** Because UDP Broadcast is completely connectionless and highly lossy (especially on Wi-Fi networks where routers drop or deprioritize broadcast traffic), the strict ping timeout frequently expires before a Pong is returned due to natural network packet loss, leading the user/UI to assume a "disconnect".

### 3. History Sync Failure (UDP MTU Fragmentation)
**Root Cause:** The sync engine attempts to send large JSON payloads over UDP.
- `HISTORY_SYNC_MAX_PACKET_BYTES` is set to `48 * 1024` (48KB).
- The standard Maximum Transmission Unit (MTU) for LANs is 1500 bytes.
- When the app sends a 48KB UDP packet, the OS fragments it into ~33 IP-level fragments.
- If **even one fragment** is dropped by the router or Wi-Fi AP, the entire 48KB packet is discarded by the receiving OS. 
- Most modern routers, firewalls, and macOS/Windows network stacks aggressively drop large fragmented UDP broadcasts to prevent flooding. This guarantees a 100% failure rate for large sync batches.
- If we lower the limit to 1400 bytes, any single clipboard item larger than 1400 bytes will fail to serialize and error out (`"History change ... is too large"`), completely halting history sync.

## Suggested Fixes & Next Steps

To fix these structural flaws and align with the original architecture plan, I recommend the following implementation adjustments:

### Step 1: Switch to TCP, QUIC, or HTTP for Bulk Transfer
UDP is fundamentally the wrong transport layer for reliable, large payload syncing (`HistorySyncPush`). 
*   **Recommendation:** Implement a lightweight TCP stream, WebSockets, or a simple HTTP server (via `warp` or `axum`) inside Tauri for the sync transport layer. This completely solves MTU fragmentation, ordered delivery, and payload size limitations.

### Step 2: Use mDNS for Direct Unicast
Instead of broadcasting UDP packets indiscriminately:
1. Use the existing `mDNS` advertiser/scanner to resolve the IP addresses of trusted `peer_device_ids`.
2. Cache the IP addresses of known peers in `sync_peer_cursor` (or in-memory state).
3. Send Pings and Sync payloads directly to the peer's specific IP via Unicast (TCP or UDP). This solves the multi-interface broadcast routing bug (one-way pings) and significantly improves reliability.

### Step 3: Improve UI State Resilience
Instead of relying on instant ping timeouts to show connection health:
*   Allow a grace period or track a `failed_ping_count` before declaring a device completely unreachable.

Let me know if you would like me to begin implementing these architectural fixes (starting with transitioning the transport layer from UDP broadcast to direct TCP/Unicast).


# Implementation Plan: HTTP Sync Transport & Media Transfer

This plan outlines the migration from the unstable UDP Broadcast sync mechanism to a reliable, secure HTTP-based transport layer using `axum` and `reqwest`, while implementing the requested media transfer capabilities to sync images.

## Goal Description
The objective is to fix the one-way ping, random disconnects, and broken history sync by replacing the UDP transport with an embedded HTTP server. This perfectly aligns with the original vision of a cursor-based reliable transport, substituting QUIC for simpler, battle-tested HTTP. We will also introduce an out-of-band blob fetching system to support syncing large images and binaries between devices.

## Architecture Recommendations

1.  **Transport Protocol**: 
    *   **Server**: Use `axum` (a lightweight, async web framework for Tokio) to host an embedded HTTP sync server.
    *   **Client**: Use `reqwest` (already in [Cargo.toml](file:///c:/Users/skurd/Documents/pastebar/PasteBarApp/src-tauri/Cargo.toml)) to send sync payloads and fetch media.
2.  **Discovery (mDNS)**:
    *   Stop broadcasting payloads via UDP.
    *   Use the existing `mDNS` library solely to advertise [device_id](file:///c:/Users/skurd/Documents/pastebar/PasteBarApp/src-tauri/src/sync/pairing_runtime.rs#1583-1586) and the port the `axum` server is listening on.
    *   Clients use mDNS to resolve a peer's [device_id](file:///c:/Users/skurd/Documents/pastebar/PasteBarApp/src-tauri/src/sync/pairing_runtime.rs#1583-1586) to their current LAN IP address.
3.  **Security Layer**:
    *   Maintain the existing AEAD envelope (`chacha20poly1305`) defined in [docs/plans/2026-02-26-device-sync-and-encryption.md](file:///c:/Users/skurd/Documents/pastebar/PasteBarApp/docs/plans/2026-02-26-device-sync-and-encryption.md). 
    *   All HTTP request bodies (and responses) will carry this encrypted envelope, ensuring that even over plain HTTP on a LAN, the data relies on the verified cryptographic trust established during pairing.
    *   Add an HTTP `Authorization: Bearer <HMAC-SHA256>` header for fast request rejection before decrypting.
4.  **Media/Image Sync Workflow**:
    *   **Phase 1 (Metadata)**: Device A syncs a history row to Device B (viaPOST `/sync/history`). The row contains a JSON metadata field referencing a `blob_hash` (e.g., an image signature).
    *   **Phase 2 (Queueing)**: Device B inserts the row but flags the blob as missing, adding the `blob_hash` to a background `FETCH_QUEUE` (which already partially exists in [src-tauri/src/sync/media.rs](file:///c:/Users/skurd/Documents/pastebar/PasteBarApp/src-tauri/src/sync/media.rs)).
    *   **Phase 3 (Transfer)**: A background Tokio task dequeues the hash and makes an HTTP GET request to `http://<device-A-ip>:<port>/sync/blob/<blob_hash>`.
    *   **Phase 4 (Storage)**: Device A reads the local image, encrypts the binary chunk-by-chunk using AEAD, and streams it in the HTTP response. Device B decrypts and saves it to its local `fs_extra` media folder, marking it as available.

## Proposed Changes

### Core Sync Module

#### [MODIFY] [src-tauri/Cargo.toml](file:///c:/Users/skurd/Documents/pastebar/PasteBarApp/src-tauri/Cargo.toml)
- Add `axum`, `tower-http`, and `tokio-util` dependencies for the HTTP server and efficient streaming.

#### [MODIFY] [src-tauri/src/sync/transport.rs](file:///c:/Users/skurd/Documents/pastebar/PasteBarApp/src-tauri/src/sync/transport.rs)
- Remove the dummy state flags.
- Implement [start()](file:///c:/Users/skurd/Documents/pastebar/PasteBarApp/src-tauri/src/sync/transport.rs#10-14) to spawn the `axum` Router on a dynamic open port (or the specific pairing port).
- Implement [stop()](file:///c:/Users/skurd/Documents/pastebar/PasteBarApp/src-tauri/src/sync/transport.rs#15-19) using an abort handle or Tokio cancellation token.
- Define HTTP routes:
  - `POST /sync/ping` -> Replaces `PairingPacket::PingJson`.
  - `POST /sync/history` -> Replaces large UDP `HistorySyncPush` payloads, allowing massive JSON batches.
  - `POST /sync/pair/request` -> Handles initial 6-digit code handshakes.
  - `GET /sync/blob/:hash` -> New endpoint for streaming AEAD encrypted binaries.

#### [MODIFY] [src-tauri/src/sync/pairing_runtime.rs](file:///c:/Users/skurd/Documents/pastebar/PasteBarApp/src-tauri/src/sync/pairing_runtime.rs)
- Refactor the event loop core. Remove `UdpSocket` listener and [discovery_target_addresses()](file:///c:/Users/skurd/Documents/pastebar/PasteBarApp/src-tauri/src/sync/pairing_runtime.rs#1015-1046) broadcast looping.
- Update [ping_trusted_peers](file:///c:/Users/skurd/Documents/pastebar/PasteBarApp/src-tauri/src/sync/pairing_runtime.rs#515-664) to use `reqwest` to individually POST to each trusted peer's last known IP address (resolved via mDNS cache).
- Update [sync_history_to_peer](file:///c:/Users/skurd/Documents/pastebar/PasteBarApp/src-tauri/src/sync/pairing_runtime.rs#1227-1398) to serialize the entire chunked history batch and POST it directly to the peer, eliminating the `48KB` MTU logic ([split_history_changes_for_udp](file:///c:/Users/skurd/Documents/pastebar/PasteBarApp/src-tauri/src/sync/pairing_runtime.rs#1399-1445)).
- Ensure graceful disconnect handling based on HTTP timeouts rather than instantaneous UDP packet drops.

#### [MODIFY] [src-tauri/src/sync/media.rs](file:///c:/Users/skurd/Documents/pastebar/PasteBarApp/src-tauri/src/sync/media.rs)
- Implement the loop that consumes `FETCH_QUEUE`.
- Use `reqwest` to fetch missing blobs from any trusted peer that advertises having it.
- Implement encrypted streaming to disk, handling partial downloads.

## Verification Plan

### Automated/Unit Tests
- **Crypto & Serialization Validation**: Add specific inline `#[test]`s to verify that the AEAD AEAD wrapper correctly encapsulates HTTP bodies and that endpoints properly reject invalid MACs or un-trusted device IDs.

### Manual Verification
1. **Network Independence Tracking**: 
   - Connect two systems (e.g., Windows and macOS on the same Wi-Fi). Set one to use a VPN/virtual adapter to verify that `mDNS` and Direct HTTP completely bypass the previous UDP multi-interface routing bug.
2. **Ping Stability Test**: 
   - Observe the UI Sync Center Modal in both devices for 5 minutes. Verify that "Disconnected" states no longer flap randomly due to packet drops, thanks to HTTP/TCP reliability.
3. **Large Text Sync Test**: 
   - Copy a 500KB text payload (well over the previous 48KB UDP limit). Wait for auto-sync. Verify it appears losslessly on the second device.
4. **Media Image Sync Test**: 
   - Capture a heavily detailed screenshot on Device A.
   - Wait 10 seconds.
   - Check Device B's clipboard history. Verify the image rendered correctly, proving the blob was successfully downloaded, decrypted, and referenced via the HTTP `/sync/blob` endpoint.
