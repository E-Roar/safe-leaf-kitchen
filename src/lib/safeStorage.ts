export interface StorageError extends Error {
  code: 'STORAGE_UNAVAILABLE' | 'STORAGE_QUOTA_EXCEEDED' | 'STORAGE_CORRUPTED';
}

export const safeStorage = {
  get: (key: string): string | null => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return null;
      }
      return localStorage.getItem(key);
    } catch (error) {
      const storageError = new Error(`Failed to read from localStorage: ${key}`) as StorageError;
      storageError.code = 'STORAGE_UNAVAILABLE';
      console.error(storageError.message, error);
      return null;
    }
  },

  set: (key: string, value: string): boolean => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      const storageError = new Error(`Failed to write to localStorage: ${key}`) as StorageError;
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        storageError.code = 'STORAGE_QUOTA_EXCEEDED';
      } else {
        storageError.code = 'STORAGE_UNAVAILABLE';
      }
      console.error(storageError.message, error);
      return false;
    }
  },

  remove: (key: string): boolean => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to remove from localStorage: ${key}`, error);
      return false;
    }
  },

  clear: (): boolean => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear localStorage', error);
      return false;
    }
  },

  getJSON: <T>(key: string, fallback: T): T => {
    try {
      const item = this.get(key);
      if (item === null) return fallback;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Failed to parse JSON from localStorage: ${key}`, error);
      return fallback;
    }
  },

  setJSON: (key: string, value: unknown): boolean => {
    try {
      const serialized = JSON.stringify(value);
      return this.set(key, serialized);
    } catch (error) {
      console.error(`Failed to serialize JSON for localStorage: ${key}`, error);
      return false;
    }
  }
};
