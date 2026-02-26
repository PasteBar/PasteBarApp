use base64::engine::general_purpose::STANDARD;
use base64::Engine as _;
use chacha20poly1305::aead::{Aead, KeyInit};
use chacha20poly1305::{ChaCha20Poly1305, Key, Nonce};
use rand::rngs::OsRng;
use rand::RngCore;
use serde::{Deserialize, Serialize};

pub type DataKey = [u8; 32];
pub type RecoveryKey = [u8; 32];

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct WrappedDataKey {
  pub version: u8,
  pub nonce: Vec<u8>,
  pub ciphertext: Vec<u8>,
}

pub fn generate_data_key() -> DataKey {
  let mut key = [0u8; 32];
  OsRng.fill_bytes(&mut key);
  key
}

pub fn generate_recovery_key() -> RecoveryKey {
  generate_data_key()
}

pub fn recovery_key_to_string(recovery_key: &RecoveryKey) -> String {
  STANDARD.encode(recovery_key)
}

pub fn recovery_key_from_string(recovery_key: &str) -> Result<RecoveryKey, String> {
  let decoded = STANDARD.decode(recovery_key).map_err(|e| e.to_string())?;
  if decoded.len() != 32 {
    return Err("Invalid recovery key length".to_string());
  }

  let mut key = [0u8; 32];
  key.copy_from_slice(&decoded);
  Ok(key)
}

pub fn wrap_data_key_with_recovery_key(
  data_key: &DataKey,
  recovery_key: &RecoveryKey,
) -> Result<WrappedDataKey, String> {
  let cipher = ChaCha20Poly1305::new(Key::from_slice(recovery_key));
  let mut nonce = [0u8; 12];
  OsRng.fill_bytes(&mut nonce);

  let ciphertext = cipher
    .encrypt(Nonce::from_slice(&nonce), data_key.as_ref())
    .map_err(|e| e.to_string())?;

  Ok(WrappedDataKey {
    version: 1,
    nonce: nonce.to_vec(),
    ciphertext,
  })
}

pub fn unwrap_data_key_with_recovery_key(
  wrapped: &WrappedDataKey,
  recovery_key: &RecoveryKey,
) -> Result<DataKey, String> {
  if wrapped.version != 1 {
    return Err(format!("Unsupported wrapped key version: {}", wrapped.version));
  }
  if wrapped.nonce.len() != 12 {
    return Err("Invalid wrapped key nonce length".to_string());
  }

  let cipher = ChaCha20Poly1305::new(Key::from_slice(recovery_key));
  let plaintext = cipher
    .decrypt(Nonce::from_slice(&wrapped.nonce), wrapped.ciphertext.as_ref())
    .map_err(|e| e.to_string())?;

  if plaintext.len() != 32 {
    return Err("Invalid wrapped data key length".to_string());
  }

  let mut data_key = [0u8; 32];
  data_key.copy_from_slice(&plaintext);
  Ok(data_key)
}
