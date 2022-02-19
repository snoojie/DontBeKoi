import { Sequelize } from "sequelize";
import { initModel as initUser } from "./models/user";
import { initModel as initPattern } from "./models/pattern";
import { initModel as initKoi } from "./models/koi";

/**
 * Initialize the models for the database.
 * Also prepopulate the Pattern and Koi tables.
 * @param sequelize 
 */
export default async function initModels(sequelize: Sequelize): Promise<void>
{
    // initialize the models
    initUser(sequelize);
    initPattern(sequelize);
    initKoi(sequelize);

    // create the tables if they don't exist yet
    await sequelize.sync();
}