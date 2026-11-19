import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSettings, setSettings, patchSettings, subscribeSettings, SETTINGS_STORAGE_KEY } from '../../src/platform/settingsStore';
import { DEFAULT_SETTINGS } from '../../src/core/defaults';

describe('settingsStore', () => {
  let mockStorage: Record<string, unknown> = {};

  beforeEach(() => {
    mockStorage = {};
    vi.mocked(chrome.storage.local.get).mockImplementation((_keys, callback) => {
      if (typeof callback === 'function') callback(mockStorage);
      return Promise.resolve(mockStorage);
    });
    vi.mocked(chrome.storage.local.set).mockImplementation((items, callback) => {
      Object.assign(mockStorage, items);
      if (typeof callback === 'function') callback();
      return Promise.resolve();
    });
  });

  it('returns default settings when storage is empty', async () => {
    const settings = await getSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it('sets and retrieves settings correctly', async () => {
    const custom = {
      ...DEFAULT_SETTINGS,
      enabled: false,
      shorts: { ...DEFAULT_SETTINGS.shorts, blockAll: false }
    };
    await setSettings(custom);
    expect(mockStorage[SETTINGS_STORAGE_KEY]).toEqual(custom);

    const loaded = await getSettings();
    expect(loaded.enabled).toBe(false);
    expect(loaded.shorts.blockAll).toBe(false);
  });

  it('patches settings using object and function updater', async () => {
    await patchSettings({ enabled: false });
    let loaded = await getSettings();
    expect(loaded.enabled).toBe(false);

    await patchSettings((prev) => ({
      shorts: { ...prev.shorts, hideInSearch: true }
    }));
    loaded = await getSettings();
    expect(loaded.shorts.hideInSearch).toBe(true);
  });

  it('subscribes to storage changes and triggers callback', () => {
    let capturedListener: ((changes: { [key: string]: chrome.storage.StorageChange }, area: string) => void) | null = null;
    vi.mocked(chrome.storage.onChanged.addListener).mockImplementation((listener) => {
      capturedListener = listener;
    });

    const notify = vi.fn();
    const unsub = subscribeSettings(notify);

    expect(chrome.storage.onChanged.addListener).toHaveBeenCalled();
    expect(capturedListener).toBeDefined();

    if (capturedListener) {
      capturedListener(
        {
          [SETTINGS_STORAGE_KEY]: {
            oldValue: DEFAULT_SETTINGS,
            newValue: { ...DEFAULT_SETTINGS, debug: true }
          }
        },
        'local'
      );
      expect(notify).toHaveBeenCalledTimes(1);
      expect(notify).toHaveBeenCalledWith(expect.objectContaining({ debug: true }));
    }

    unsub();
    expect(chrome.storage.onChanged.removeListener).toHaveBeenCalled();
  });
});
