import { Logger } from "./util/logger";
import { RethrownError } from "./util/rethrownError";

console.log("===============");
console.log("===============");
console.log("===============");
console.log("===============");

function connect() {
    throw new Error("No API token");
}
function getGoogleSpreadsheet() {
    try { connect(); }
    catch (error) { throw new RethrownError("Couldn't connect to google", error); }
}
function getMyFish(){
    try { getGoogleSpreadsheet() }
    catch(error) { throw new RethrownError("Couldn't get spreadsheet", error); }
}
try{ getMyFish(); }
catch(error) { Logger.error(error); }

Logger.log("Done!");