import type {Config} from '@jest/types';

const config: Config.InitialOptions = {
  preset: "ts-jest",
  setupFiles: ["./tests/_setup/setup.ts"]
};
export default config;
