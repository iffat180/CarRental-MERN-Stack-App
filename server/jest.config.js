export default {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  // Integration tests spin up an in-memory MongoDB replica set and must run
  // serially — they have their own config (jest.integration.config.js).
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/integration/'],
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/jest.config.js',
    '!**/server.js',
    '!**/seed/**',
    '!**/lambda/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000,
  transform: {},
  moduleNameMapper: {},
  setupFilesAfterEnv: [],
};

