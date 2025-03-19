export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: ["<rootDir>/**/*.test.js", "!**/client/**"],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "<rootDir>/**/*.js", 
    "!**/client/**",
    "!**/coverage/**",
    "!**/playwright-report/**",
    "!**/tests-examples/**",
  ],
  // coverageThreshold: {
  //   global: {
  //     lines: 20,
  //     functions: 20,
  //   },
  // },
};
