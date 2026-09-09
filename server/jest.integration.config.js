// Config for integration tests that need a real MongoDB (in-memory replica set).
// Run serially with a generous timeout so replica-set startup + transactions
// don't race each other across workers.
export default {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/integration/**/*.test.js'],
  testTimeout: 120000,
  maxWorkers: 1,
  transform: {},
  moduleNameMapper: {},
  setupFilesAfterEnv: [],
};
