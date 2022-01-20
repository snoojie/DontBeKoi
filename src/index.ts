import { DontBeKoiBot } from "./dontBeKoiBot";

console.log("===============");
console.log("===============");
console.log("===============");
console.log("===============");

async function stuff() {
    let bot = DontBeKoiBot.getInstance();
    await bot.start();
}
stuff().catch(console.log);