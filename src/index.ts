import Logger from "./util/logger";
import bot from "./dontBeKoiBot";


console.log("===============");
console.log("===============");
console.log("===============");
console.log("===============");

bot.start()
.catch(error => {
    Logger.error(error);
    return bot.stop();
});

/*db.init()
    .then(_ => Logger.log("Done"))
    .catch(Logger.error);*/