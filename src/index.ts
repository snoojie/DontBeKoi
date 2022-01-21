import { Logger } from "./util/logger";
import bot from "./dontBeKoiBot";

console.log("===============");
console.log("===============");
console.log("===============");
console.log("===============");

bot.start()
.catch(error => {
    Logger.error(error);
    bot.stop();
});