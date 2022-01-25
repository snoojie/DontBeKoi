import Logger from "../../src/util/logger";

// disable Logger from printing to console
Logger.log = jest.fn();
Logger.error = jest.fn();