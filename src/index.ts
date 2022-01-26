//import Logger from "./util/logger";
//import bot from "./dontBeKoiBot";
import { DataTypes, Sequelize } from "sequelize";
//import db from "./db/db";

console.log("===============");
console.log("===============");
console.log("===============");
console.log("===============");

let sequelize = new Sequelize(
    "postgres://postgres:478963@localhost:5432/playground",
    { quoteIdentifiers: false }
);
sequelize.getQueryInterface().createTable(
    "Users", 
    { 
        "name" : DataTypes.STRING,
    }
);

/*bot.start()
.catch(error => {
    Logger.error(error);
    return bot.stop();
});

/*db.init()
    .then(_ => Logger.log("Done"))
    .catch(Logger.error);*/