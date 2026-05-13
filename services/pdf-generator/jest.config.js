module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  transform: { "^.+\\.tsx?$": ["ts-jest", {}] },
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/index.ts",
    "!src/server.ts",
    "!src/renderers/fix-layout.ts",
  ],
  coverageThreshold: {
    global: { lines: 90, functions: 90, branches: 75, statements: 90 },
  },
}
