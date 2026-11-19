import { Settings } from '../core/types';
import { DEFAULT_SETTINGS } from '../core/defaults';
import { migrateSettings } from './migrations';

export const SETTINGS_STORAGE_KEY = 'yfc_settings';

export async function getSettings(): Promise<Settings> {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    return { ...DEFAULT_SETTINGS };
  }

  return new Promise<Settings>((resolve) => {
    chrome.storage.local.get([SETTINGS_STORAGE_KEY], (res) => {
      if (chrome.runtime.lastError) {
        console.error('[YFC] Failed to load settings:', chrome.runtime.lastError);
        resolve({ ...DEFAULT_SETTINGS });
        return;
      }
      const raw = res ? res[SETTINGS_STORAGE_KEY] : null;
      if (!raw) {
        resolve({ ...DEFAULT_SETTINGS });
      } else {
        resolve(migrateSettings(raw));
      }
    });
  });
}

export async function setSettings(settings: Settings): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    return;
  }

  return new Promise<void>((resolve, reject) => {
    chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: settings }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

export async function patchSettings(
  patch: Partial<Settings> | ((prev: Settings) => Partial<Settings>)
): Promise<Settings> {
  const current = await getSettings();
  const partial = typeof patch === 'function' ? patch(current) : patch;
  const updated: Settings = {
    ...current,
    ...partial
  };
  await setSettings(updated);
  return updated;
}

export function subscribeSettings(callback: (settings: Settings) => void): () => void {
  if (
    typeof chrome === 'undefined' ||
    !chrome.storage ||
    !chrome.storage.onChanged ||
    !chrome.storage.onChanged.addListener
  ) {
    return () => {};
  }

  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string
  ) => {
    if (areaName === 'local' && changes[SETTINGS_STORAGE_KEY]) {
      const newValue = changes[SETTINGS_STORAGE_KEY].newValue;
      callback(migrateSettings(newValue));
    }
  };

  chrome.storage.onChanged.addListener(listener);
  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
}
