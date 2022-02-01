import type {Config} from '@jest/types';

const config: Config.InitialOptions = {
  preset: "ts-jest",
  setupFilesAfterEnv: ["./tests/_setup/setupAfterEnv.js"]
};
export default config;
