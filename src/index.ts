//import { DataAccessLayer } from "./database/dataAccessLayer";
//import Database from "./database/database";
import Logger from "./util/logger";
import Bot from "./dontBeKoiBot";
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

Bot.start()
.catch(error => {
    Logger.error(error);
    return Bot.stop();
});

/*Database.start()
    .then(_ => Logger.log("Done"))
    //.then(_ => DataAccessLayer.getUsersMissingKoi("mashiro", "akachan"))
    //.then(response => Logger.log(JSON.stringify(response, null, 2)))
    .then(_ => Database.stop())
    .catch(Logger.error);*/