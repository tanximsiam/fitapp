import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { SecureStorage } from '@aparajita/capacitor-secure-storage'

/**
 * Encrypted local storage for a signed-in person's cached records and unsent entries.
 * Each value is AES-GCM encrypted with a random 256-bit key that lives in the Keychain / Keystore,
 * then written to the app's private data folder. Health records never sit on disk in plain text.
 */

const KEY_NAME = 'fitapp.vaultKey'
const ROOT = 'vault'

let keyPromise: Promise<CryptoKey> | null = null

/** Chunked, because spreading a large cache into fromCharCode overflows the call stack. */
function toB64(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

function key(): Promise<CryptoKey> {
  keyPromise ??= (async () => {
    let raw = await SecureStorage.getItem(KEY_NAME)
    if (!raw) {
      raw = toB64(crypto.getRandomValues(new Uint8Array(32)))
      await SecureStorage.setItem(KEY_NAME, raw)
    }
    return crypto.subtle.importKey('raw', fromB64(raw), 'AES-GCM', false, ['encrypt', 'decrypt'])
  })()
  return keyPromise
}

/** Encrypts a JSON value to "iv.ciphertext" (both base64). */
export async function seal(value: unknown): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = new TextEncoder().encode(JSON.stringify(value))
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await key(), data))
  return `${toB64(iv)}.${toB64(cipher)}`
}

export async function open<T>(sealed: string): Promise<T> {
  const [iv, cipher] = sealed.split('.').map(fromB64)
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, await key(), cipher)
  return JSON.parse(new TextDecoder().decode(plain))
}

const path = (scope: string, name: string) => `${ROOT}/${scope}/${name}.bin`

export const vault = {
  async write(scope: string, name: string, value: unknown) {
    await Filesystem.writeFile({ path: path(scope, name), data: await seal(value), directory: Directory.Data, encoding: Encoding.UTF8, recursive: true })
  },
  /** null when missing or unreadable (e.g. the key was reset); a cache miss is never fatal. */
  async read<T>(scope: string, name: string): Promise<T | null> {
    try {
      const { data } = await Filesystem.readFile({ path: path(scope, name), directory: Directory.Data, encoding: Encoding.UTF8 })
      return await open<T>(data as string)
    } catch {
      return null
    }
  },
  /** Removes everything stored for every account, and the key, so nothing left on disk can be read. */
  async clear() {
    await Filesystem.rmdir({ path: ROOT, directory: Directory.Data, recursive: true }).catch(() => {})
    await SecureStorage.removeItem(KEY_NAME)
    keyPromise = null
  },
}
