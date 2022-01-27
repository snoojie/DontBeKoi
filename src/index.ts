import Logger from "./util/logger";
import bot from "./dontBeKoiBot";
//import UserDal from "./db/user";
//import { Sequelize } from "sequelize";

console.log("===============");
console.log("===============");
console.log("===============");
console.log("===============");

/*let sequelize = new Sequelize(
    "postgres://postgres:478963@localhost:5432/playground", 
    { 
        quoteIdentifiers: false,
        define: { underscored: true } 
    }
);
UserDal.init(sequelize)
.then(_ => console.log("============initialized============"))
.then(_ => UserDal.saveUser("did", "my name", "sid") )
.then(_ => console.log("============User 1 added============"))
.then(_ => sequelize.close())
.then(_ => console.log("============closed============"))
.catch(Logger.error);*/


bot.start()
.catch(error => {
    Logger.error(error);
    return bot.stop();
});

/*db.init()
    .then(_ => Logger.log("Done"))
    .catch(Logger.error);*/