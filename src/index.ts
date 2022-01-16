import { DontBeKoiBot } from "./dontBeKoiBot";
import { Logger } from "./logger";

let bot: DontBeKoiBot = DontBeKoiBot.getInstance();
bot.start()
    .catch(error => Logger.error("Uncaught error", error));