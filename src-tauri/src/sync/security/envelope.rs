use chacha20poly1305::aead::{Aead, KeyInit};
use chacha20poly1305::{ChaCha20Poly1305, Key, Nonce};
use rand::rngs::OsRng;
use rand::RngCore;
use serde::{Deserialize, Serialize};

use super::keys::DataKey;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct EncryptedEnvelope {
  pub version: u8,
  pub nonce: Vec<u8>,
  pub ciphertext: Vec<u8>,
}

pub fn encrypt_payload(payload: &[u8], key: &DataKey) -> Result<EncryptedEnvelope, String> {
  let cipher = ChaCha20Poly1305::new(Key::from_slice(key));
  let mut nonce = [0u8; 12];
  OsRng.fill_bytes(&mut nonce);

  let ciphertext = cipher
    .encrypt(Nonce::from_slice(&nonce), payload)
    .map_err(|e| e.to_string())?;

  Ok(EncryptedEnvelope {
    version: 1,
    nonce: nonce.to_vec(),
    ciphertext,
  })
}

pub fn decrypt_payload(envelope: &EncryptedEnvelope, key: &DataKey) -> Result<Vec<u8>, String> {
  if envelope.version != 1 {
    return Err(format!("Unsupported envelope version: {}", envelope.version));
  }
  if envelope.nonce.len() != 12 {
    return Err("Invalid nonce length".to_string());
  }

  let cipher = ChaCha20Poly1305::new(Key::from_slice(key));
  cipher
    .decrypt(Nonce::from_slice(&envelope.nonce), envelope.ciphertext.as_ref())
    .map_err(|e| e.to_string())
}
