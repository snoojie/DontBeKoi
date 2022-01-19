import { Logger } from "./util/logger";
import { RethrownError } from "./util/rethrownError";
import { Config } from "./util/config";

console.log("===============");
console.log("===============");
console.log("===============");
console.log("===============");

function logToken()
{
    try 
    {
        let token = Config.getBotToken();
        Logger.log(`token: ${token}`);
    }
    catch(error)
    {
        throw new RethrownError("Failed to get token", error);
    }
}

try
{
    logToken();
}
catch (error)
{
    Logger.error(error);
}