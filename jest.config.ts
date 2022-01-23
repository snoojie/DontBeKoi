import type {Config} from '@jest/types';

const config: Config.InitialOptions = {
  preset: "ts-jest",
  setupFiles: ["./tests/_config/setup.ts"],
  collectCoverage: true
};
export default config;
