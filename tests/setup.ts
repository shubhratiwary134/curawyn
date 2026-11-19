import '@testing-library/jest-dom';

// Chrome mock for tests
const storageMock = {
  local: {
    get: vi.fn().mockImplementation((keys: string | string[] | null, callback?: (items: Record<string, unknown>) => void) => {
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
    }),
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    }
  }
};

(globalThis as unknown as { chrome: unknown }).chrome = {
  storage: storageMock,
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
