import Logger from "./util/logger";
import bot from "./dontBeKoiBot";
//import UserDal from "./database/dataAccessLayers/user";
//import { Sequelize } from "sequelize";
//import Spreadsheet from "./google/spreadsheet";

console.log("===============");
console.log("===============");
console.log("===============");
console.log("===============");


/*Spreadsheet.getValues("1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo", "Overview!A4:I")
    .then((_) => { 
        //Logger.log(JSON.stringify(data));
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

/*db.init()
    .then(_ => Logger.log("Done"))
    .catch(Logger.error);*/