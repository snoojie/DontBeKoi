import {Logger} from "./util/logger";

Logger.log("I r log!!!!");
Logger.error("I r error!!!!", new Error("omg i'm thrown"));
console.log("post");