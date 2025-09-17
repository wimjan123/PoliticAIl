/** @type {import('jest').Config} */
const config = {
  // Test environment
  testEnvironment: 'jsdom',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],

  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@store/(.*)$': '<rootDir>/src/store/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@test/(.*)$': '<rootDir>/src/test/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/test/__mocks__/fileMock.js'
  },

  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      isolatedModules: true
    }],
    '^.+\\.(js|jsx)$': 'babel-jest'
  },

  // File extensions
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node'
  ],

  // Test file patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/src/**/*.(test|spec).(ts|tsx|js)'
  ],

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/test/**/*',
    '!src/**/index.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts'
  ],
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html'
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 80,
      statements: 80
    }
  },

  // Test timeout
  testTimeout: 10000,

  // Clear mocks between tests
  clearMocks: true,

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
    '<rootDir>/src-tauri/'
  ],

  // Globals
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  },

  // Performance tests configuration
  projects: [
    // Unit tests
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.test.(ts|tsx)'],
      testEnvironment: 'jsdom'
    },
    // Integration tests
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/src/**/*.integration.test.(ts|tsx)'],
      testEnvironment: 'jsdom',
      testTimeout: 30000
    },
    // Performance tests
    {
      displayName: 'performance',
      testMatch: ['<rootDir>/src/**/*.performance.test.(ts|tsx)'],
      testEnvironment: 'node',
      testTimeout: 60000
    }
  ]
};

export default config;