// Unit tests. TypeScript is transformed by @swc/jest (fast, no type-checking);
// type safety is enforced separately by `npm run typecheck`.
const swc = {
  jsc: {
    parser: { syntax: 'typescript', tsx: false, decorators: false },
    target: 'es2022',
  },
  module: { type: 'es6' },
};

export default {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    // NodeNext-style imports carry a .js suffix even for .ts sources.
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': ['@swc/jest', swc],
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  // Integration tests spin up an in-memory MongoDB replica set and must run
  // serially — they have their own config (jest.integration.config.js).
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/integration/'],
  collectCoverageFrom: [
    '**/*.ts',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/dist/**',
    '!**/*.config.ts',
    '!**/server.ts',
    '!**/seed/**',
    '!**/lambda/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000,
};
