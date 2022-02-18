/*import Bot from "./dontBeKoiBot";

Bot.start()
    .catch(_ => { 
        // nothing to do. Bot.start() already printed the error for us. 
    });*/

import { CommunitySpreadsheet } from "./google/communitySpreadsheet";

CommunitySpreadsheet.getAllPatterns();