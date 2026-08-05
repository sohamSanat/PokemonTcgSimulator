/**
 * storageDb.ts
 * Asynchronous IndexedDB storage engine for Pokemon TCG Simulator.
 * Provides quota-free storage for card collections, binders, and catalogues with fallback to LocalStorage.
 */

const DB_NAME = 'PokemonTCGSimDB';
const DB_VERSION = 1;
const STORE_KV = 'keyValueStore';

let dbInstance: IDBDatabase | null = null;
const memoryCache = new Map<string, string>();

async function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;
  if (typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB unavailable');
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_KV)) {
        db.createObjectStore(STORE_KV);
      }
    };
    request.onsuccess = (e: any) => {
      dbInstance = e.target.result as IDBDatabase;
      resolve(dbInstance);
    };
    request.onerror = (e) => reject(e);
  });
}

export async function setItem(key: string, value: string): Promise<void> {
  memoryCache.set(key, value);
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_KV, 'readwrite');
    tx.objectStore(STORE_KV).put(value, key);
  } catch {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.warn('Storage fallback failed:', e);
      }
    }
  }
}

export async function getItem(key: string): Promise<string | null> {
  if (memoryCache.has(key)) {
    return memoryCache.get(key)!;
  }
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_KV, 'readonly');
    const request = tx.objectStore(STORE_KV).get(key);
    const value = await new Promise<string | null>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    if (value !== null) {
      memoryCache.set(key, value);
      return value;
    }
  } catch {
    // Fallback to localStorage
  }
  const localVal = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  if (localVal !== null) {
    memoryCache.set(key, localVal);
  }
  return localVal;
}

export function getItemSync(key: string): string | null {
  if (memoryCache.has(key)) {
    return memoryCache.get(key)!;
  }
  if (typeof localStorage !== 'undefined') {
    const localVal = localStorage.getItem(key);
    if (localVal !== null) memoryCache.set(key, localVal);
    return localVal;
  }
  return null;
}

export function setItemSync(key: string, value: string): void {
  memoryCache.set(key, value);
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('Sync storage write warning:', e);
    }
  }
  void setItem(key, value);
}

export async function initStorageMigration(): Promise<void> {
  if (typeof localStorage === 'undefined') return;
  const legacyKeys = ['tcg_catalogues', 'tcg_binders', 'tcg_user_profile'];
  for (const baseKey of legacyKeys) {
    const localVal = localStorage.getItem(baseKey);
    if (localVal) {
      const existingDb = await getItem(baseKey);
      if (!existingDb) {
        await setItem(baseKey, localVal);
      }
    }
  }
}
