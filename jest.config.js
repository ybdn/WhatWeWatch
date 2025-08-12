module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.@(ts|tsx|js)'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};
