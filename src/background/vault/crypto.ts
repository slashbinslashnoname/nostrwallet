// Password -> PBKDF2 -> "password key" that only ever wraps/unwraps a random
// master key. The master key (never derived from the password directly) is
// what actually encrypts account secrets, so a password change only needs to
// re-wrap one 32-byte key, not re-encrypt every account.

export const PBKDF2_ITERATIONS = 600_000
const AES_KEY_LENGTH = 256
const GCM_IV_LENGTH = 12 // bytes

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length))
}

export async function derivePasswordKey(
  password: string,
  salt: Uint8Array,
  iterations: number
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    false,
    ['wrapKey', 'unwrapKey']
  )
}

export async function generateMasterKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: AES_KEY_LENGTH }, true, [
    'encrypt',
    'decrypt',
  ])
}

export async function importMasterKey(raw: Uint8Array, extractable = false): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', raw as BufferSource, 'AES-GCM', extractable, [
    'encrypt',
    'decrypt',
  ])
}

export async function exportMasterKey(key: CryptoKey): Promise<Uint8Array> {
  const raw = await crypto.subtle.exportKey('raw', key)
  return new Uint8Array(raw)
}

export async function wrapMasterKey(
  masterKey: CryptoKey,
  passwordKey: CryptoKey
): Promise<{ wrapped: string; iv: string }> {
  const iv = randomBytes(GCM_IV_LENGTH)
  const wrapped = await crypto.subtle.wrapKey('raw', masterKey, passwordKey, {
    name: 'AES-GCM',
    iv: iv as BufferSource,
  })
  return { wrapped: bytesToBase64(new Uint8Array(wrapped)), iv: bytesToBase64(iv) }
}

export async function unwrapMasterKey(
  wrapped: string,
  iv: string,
  passwordKey: CryptoKey
): Promise<CryptoKey> {
  return crypto.subtle.unwrapKey(
    'raw',
    base64ToBytes(wrapped) as BufferSource,
    passwordKey,
    { name: 'AES-GCM', iv: base64ToBytes(iv) as BufferSource },
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  )
}

export async function encryptWithKey(
  key: CryptoKey,
  plaintext: Uint8Array
): Promise<{ ciphertext: string; iv: string }> {
  const iv = randomBytes(GCM_IV_LENGTH)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    plaintext as BufferSource
  )
  return { ciphertext: bytesToBase64(new Uint8Array(ciphertext)), iv: bytesToBase64(iv) }
}

export async function decryptWithKey(
  key: CryptoKey,
  ciphertext: string,
  iv: string
): Promise<Uint8Array> {
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(iv) as BufferSource },
    key,
    base64ToBytes(ciphertext) as BufferSource
  )
  return new Uint8Array(plaintext)
}
