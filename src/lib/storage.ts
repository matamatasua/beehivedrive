// ============================================
// localStorage Persistence Layer
// ============================================
// Safe wrapper around localStorage that handles SSR (window undefined)
// and JSON serialization/deserialization with type safety.

const STORAGE_KEYS = {
  user: "beehive_user",
  progress: "beehive_progress",
  sessions: "beehive_sessions",
  onboarding: "beehive_onboarding",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

function isClient(): boolean {
  return typeof window !== "undefined";
}

/**
 * Read a value from localStorage and parse it as JSON.
 * Returns `null` if the key doesn't exist, parsing fails, or we're on the server.
 */
export function getStorageItem<T>(key: StorageKey): T | null {
  if (!isClient()) return null;

  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    console.warn(`[storage] Failed to read key "${key}" from localStorage`);
    return null;
  }
}

/**
 * Write a value to localStorage as JSON.
 * No-op on the server.
 */
export function setStorageItem<T>(key: StorageKey, value: T): void {
  if (!isClient()) return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.warn(`[storage] Failed to write key "${key}" to localStorage`);
  }
}

/**
 * Remove a key from localStorage.
 */
export function removeStorageItem(key: StorageKey): void {
  if (!isClient()) return;

  try {
    localStorage.removeItem(key);
  } catch {
    console.warn(`[storage] Failed to remove key "${key}" from localStorage`);
  }
}

/**
 * Clear all BeehiveDrive data from localStorage.
 */
export function clearAllStorage(): void {
  removeStorageItem(STORAGE_KEYS.user);
  removeStorageItem(STORAGE_KEYS.progress);
  removeStorageItem(STORAGE_KEYS.sessions);
  removeStorageItem(STORAGE_KEYS.onboarding);
}

export { STORAGE_KEYS };
