// Integration tests that need a real MongoDB (in-memory replica set).
// Run serially with a generous timeout so replica-set startup + transactions
// don't race each other across workers.
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
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': ['@swc/jest', swc],
  },
  testMatch: ['**/__tests__/integration/**/*.test.ts'],
  testTimeout: 120000,
  maxWorkers: 1,
};
