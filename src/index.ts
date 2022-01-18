import {Logger} from "./util/logger";

Logger.log("I'm a happy log");
Logger.error("I r error!!!!", new Error("omg i'm thrown"));
console.log("post");

/*console.log("\x1b[38;5;130m%s\x1b[0m", "zero");
console.log("\x1b[38;5;131m%s\x1b[0m", "one");
console.log("\x1b[38;5;132m%s\x1b[0m", "two");

"\033[38;5;130mzero\033[0m"*/