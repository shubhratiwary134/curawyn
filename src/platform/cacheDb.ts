import { Classification } from '../core/types';

export interface CachedClassification {
  videoId: string;
  classification: Classification;
  cachedAt: number;
}

export interface ImpressionRecord {
  videoId: string;
  timestamp: number;
  subgenreId?: string;
  channelId?: string;
}

const DB_NAME = 'yfc_cache_db';
const DB_VERSION = 1;
const STORE_CLASSIFICATIONS = 'classifications';
const STORE_IMPRESSIONS = 'impressions';
const STORE_SEEN = 'seen';

const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_SEEN_IDS = 20000;

// In-memory fallback
const memoryClassifications = new Map<string, CachedClassification>();
const memoryImpressions: ImpressionRecord[] = [];
const memorySeen = new Set<string>();

let dbPromise: Promise<IDBDatabase | null> | null = null;

function getDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_CLASSIFICATIONS)) {
            db.createObjectStore(STORE_CLASSIFICATIONS, { keyPath: 'videoId' });
          }
          if (!db.objectStoreNames.contains(STORE_IMPRESSIONS)) {
            const impStore = db.createObjectStore(STORE_IMPRESSIONS, {
              autoIncrement: true,
              keyPath: 'id'
            });
            impStore.createIndex('videoId', 'videoId', { unique: false });
            impStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
          if (!db.objectStoreNames.contains(STORE_SEEN)) {
            db.createObjectStore(STORE_SEEN, { keyPath: 'videoId' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
          console.warn('[YFC] IndexedDB open error, using memory fallback');
          resolve(null);
        };
      } catch (_e) {
        resolve(null);
      }
    });
  }
  return dbPromise;
}

export async function getCachedClassification(
  videoId: string
): Promise<Classification | null> {
  const db = await getDb();
  if (!db) {
    const mem = memoryClassifications.get(videoId);
    if (!mem) return null;
    if (Date.now() - mem.cachedAt > TTL_MS) {
      memoryClassifications.delete(videoId);
      return null;
    }
    return mem.classification;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_CLASSIFICATIONS, 'readonly');
      const store = tx.objectStore(STORE_CLASSIFICATIONS);
      const req = store.get(videoId);
      req.onsuccess = () => {
        const res = req.result as CachedClassification | undefined;
        if (!res) {
          resolve(null);
          return;
        }
        if (Date.now() - res.cachedAt > TTL_MS) {
          // expired
          resolve(null);
        } else {
          resolve(res.classification);
        }
      };
      req.onerror = () => resolve(null);
    } catch (_e) {
      resolve(null);
    }
  });
}

export async function setCachedClassification(
  videoId: string,
  classification: Classification
): Promise<void> {
  const item: CachedClassification = {
    videoId,
    classification,
    cachedAt: Date.now()
  };

  const db = await getDb();
  if (!db) {
    memoryClassifications.set(videoId, item);
    return;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_CLASSIFICATIONS, 'readwrite');
      const store = tx.objectStore(STORE_CLASSIFICATIONS);
      store.put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch (_e) {
      resolve();
    }
  });
}

export async function recordImpression(record: ImpressionRecord): Promise<void> {
  const db = await getDb();
  if (!db) {
    memoryImpressions.push(record);
    return;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_IMPRESSIONS, 'readwrite');
      const store = tx.objectStore(STORE_IMPRESSIONS);
      store.add(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch (_e) {
      resolve();
    }
  });
}

export async function getImpressionsCountInWindow(
  videoId: string,
  windowHours: number
): Promise<number> {
  const cutoff = Date.now() - windowHours * 60 * 60 * 1000;
  const db = await getDb();

  if (!db) {
    return memoryImpressions.filter(
      (imp) => imp.videoId === videoId && imp.timestamp >= cutoff
    ).length;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_IMPRESSIONS, 'readonly');
      const store = tx.objectStore(STORE_IMPRESSIONS);
      const index = store.index('videoId');
      const req = index.getAll(videoId);
      req.onsuccess = () => {
        const list = (req.result || []) as ImpressionRecord[];
        const count = list.filter((r) => r.timestamp >= cutoff).length;
        resolve(count);
      };
      req.onerror = () => resolve(0);
    } catch (_e) {
      resolve(0);
    }
  });
}

export async function markVideoSeen(videoId: string): Promise<void> {
  memorySeen.add(videoId);
  if (memorySeen.size > MAX_SEEN_IDS) {
    const oldest = memorySeen.values().next().value;
    if (oldest) memorySeen.delete(oldest);
  }

  const db = await getDb();
  if (!db) return;

  try {
    const tx = db.transaction(STORE_SEEN, 'readwrite');
    const store = tx.objectStore(STORE_SEEN);
    store.put({ videoId, seenAt: Date.now() });
  } catch (_e) {
    // Ignore
  }
}

export async function isVideoSeen(videoId: string): Promise<boolean> {
  if (memorySeen.has(videoId)) return true;

  const db = await getDb();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_SEEN, 'readonly');
      const store = tx.objectStore(STORE_SEEN);
      const req = store.get(videoId);
      req.onsuccess = () => {
        if (req.result) {
          memorySeen.add(videoId);
          resolve(true);
        } else {
          resolve(false);
        }
      };
      req.onerror = () => resolve(false);
    } catch (_e) {
      resolve(false);
    }
  });
}
