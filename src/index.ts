import { Logger } from "./util/logger";
import bot from "./dontBeKoiBot";
//import db from "./db/db";

console.log("===============");
console.log("===============");
console.log("===============");
console.log("===============");

bot.start()
.catch(error => {
    Logger.error(error);
    bot.stop();
});

/*db.init()
    .then(_ => Logger.log("Done"))
    .catch(Logger.error);*/