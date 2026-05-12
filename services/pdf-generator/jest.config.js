module.exports = {
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {}],
  },
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: 'coverage',
}
