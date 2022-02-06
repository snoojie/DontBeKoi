import Logger from "./util/logger";
import Bot from "./dontBeKoiBot";

Bot.start()
.catch(error => {
    Logger.error(error);
    return Bot.stop();
});