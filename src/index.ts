import { Logger } from "./util/logger";
//import { Config } from "./util/config";

try
{
    //Logger.log(Config.getBotToken());
    Logger.log("Hello there");
}
catch (error)
{
    Logger.error("Config failed to get bot token", error);
}
