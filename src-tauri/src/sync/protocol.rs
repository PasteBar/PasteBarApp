use super::snapshot::SnapshotManifest;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SyncMsg {
  Nack { reason: String, recoverable: bool },
  SnapshotManifest(SnapshotManifest),
}
