import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Chrome mock for tests
const storageLocalMock = {
  get: vi.fn().mockImplementation((_keys: unknown, callback?: (items: Record<string, unknown>) => void) => {
    const res = {};
    if (typeof callback === 'function') callback(res);
    return Promise.resolve(res);
  }),
  set: vi.fn().mockImplementation((_items: Record<string, unknown>, callback?: () => void) => {
    if (typeof callback === 'function') callback();
    return Promise.resolve();
  }),
  remove: vi.fn().mockImplementation((_keys: string | string[], callback?: () => void) => {
    if (typeof callback === 'function') callback();
    return Promise.resolve();
  }),
  clear: vi.fn().mockImplementation((callback?: () => void) => {
    if (typeof callback === 'function') callback();
    return Promise.resolve();
  })
};

const storageOnChangedMock = {
  addListener: vi.fn(),
  removeListener: vi.fn()
};

(globalThis as unknown as { chrome: unknown }).chrome = {
  storage: {
    local: storageLocalMock,
    onChanged: storageOnChangedMock
  },
  runtime: {
    id: 'mock-extension-id',
    getURL: (path: string) => `chrome-extension://mock-extension-id/${path}`,
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    },
    onInstalled: {
      addListener: vi.fn()
    },
    openOptionsPage: vi.fn()
  },
  tabs: {
    create: vi.fn(),
    update: vi.fn(),
    query: vi.fn().mockResolvedValue([])
  },
  contextMenus: {
    create: vi.fn(),
    removeAll: vi.fn().mockImplementation((cb?: () => void) => {
      if (cb) cb();
      return Promise.resolve();
    }),
    onClicked: {
      addListener: vi.fn()
    }
  },
  permissions: {
    request: vi.fn().mockResolvedValue(true),
    contains: vi.fn().mockResolvedValue(true)
  }
};
