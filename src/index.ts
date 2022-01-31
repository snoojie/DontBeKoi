//import DataAccessLayer from "./database/dataAccessLayer";
//import Database from "./database/database";
import Logger from "./util/logger";
import bot from "./dontBeKoiBot";
//import { CommunitySpreadsheet } from "./google/communitySpreadsheet";
//import { Sequelize } from "sequelize";

console.log("===============");
console.log("===============");
console.log("===============");
console.log("===============");


/*CommunitySpreadsheet.getProgressives()
    .then((data) => { 
        //Logger.log(JSON.stringify(data));
        Logger.log(data[0]!.kois[17]);
        //Logger.log(JSON.stringify(data!.get("Inazuma")));
        Logger.log("DONE");
    })
    .catch(Logger.error);*/


bot.start()
.catch(error => {
    Logger.error(error);
    return bot.stop();
});

/*let sequelize = new Sequelize(
    "postgres://postgres:478963@localhost:5432/playground", 
    { 
        quoteIdentifiers: false,
        logging: false,
        define: { underscored: true } 
    }
);
UserDal.init(sequelize)
.then(_ => console.log("============initialized============"))
.then(_ => UserDal.saveUser("did8", "my name", "sid8") )
.then(_ => console.log("============User 1 added============"))
.then(_ => sequelize.close())
.then(_ => console.log("============closed============"))
.catch(Logger.error);*/
/*
Database.start()
    .then(_ => DataAccessLayer.getDiscordUsersMissingKoi("Shigin", "Aishite"))
    .then(Logger.log)
    .then(_ => Database.stop())
    .catch(Logger.error);
*/