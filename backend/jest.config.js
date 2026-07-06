/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/src/tests/**/*.test.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/migrations/**',
    '!src/utils/seed-*.js',
    '!src/utils/wipe-*.js',
    '!src/utils/reset-*.js',
    '!src/utils/export-*.js',
  ],
  testTimeout: 15000,
  verbose: true,
};
