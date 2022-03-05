import type {Config} from '@jest/types';

const config: Config.InitialOptions = {
  preset: "ts-jest",
  setupFilesAfterEnv: ["./tests/_setup/setupAfterEnv.js"],
  testTimeout: 60000,
  coveragePathIgnorePatterns: ["/node_modules/", "/tests/"]
};
export default config;
