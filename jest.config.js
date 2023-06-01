export default {
  testEnvironment: "node",
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx,js}'],
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    "^.+\\.tsx?$": "jest-esbuild",
  },
};
