import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: readonly number[] = [];

  constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}

  disconnect(): void {}
  observe(_target: Element): void {}
  unobserve(_target: Element): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Tauri API
const mockInvoke = jest.fn();
const mockListen = jest.fn();
const mockEmit = jest.fn();

// Mock tauri API
jest.mock('@tauri-apps/api/tauri', () => ({
  invoke: mockInvoke,
}));

jest.mock('@tauri-apps/api/event', () => ({
  listen: mockListen,
  emit: mockEmit,
}));

jest.mock('@tauri-apps/api/window', () => ({
  appWindow: {
    show: jest.fn(),
    hide: jest.fn(),
    close: jest.fn(),
    minimize: jest.fn(),
    maximize: jest.fn(),
    toggleMaximize: jest.fn(),
    setTitle: jest.fn(),
    setSize: jest.fn(),
    setPosition: jest.fn(),
    center: jest.fn(),
    requestUserAttention: jest.fn(),
    setIcon: jest.fn(),
    setSkipTaskbar: jest.fn(),
    setDecorations: jest.fn(),
    setAlwaysOnTop: jest.fn(),
    setFullscreen: jest.fn(),
    setFocus: jest.fn(),
  },
  WebviewWindow: jest.fn().mockImplementation(() => ({
    show: jest.fn(),
    hide: jest.fn(),
    close: jest.fn(),
    destroy: jest.fn(),
    emit: jest.fn(),
    listen: jest.fn(),
  })),
}));

// Mock crypto for testing
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn(() => new Uint32Array(10)),
    randomUUID: jest.fn(() => 'test-uuid-1234'),
  },
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
  })
) as jest.Mock;

// Mock console methods in test environment
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    // Suppress React 18 warnings in tests
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.REACT_APP_API_URL = 'http://localhost:3001';
process.env.REACT_APP_REDIS_URL = 'redis://localhost:6379';
process.env.REACT_APP_MONGODB_URL = 'mongodb://localhost:27017/politicai_test';

// Global test utilities
export { mockInvoke, mockListen, mockEmit, localStorageMock, sessionStorageMock };