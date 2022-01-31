import { Sequelize } from "sequelize";
import RethrownError from "../util/rethrownError";
import { User, initModel as initUser } from "./models/user";
import { Pattern, initModel as initPattern, PatternAttributes } from "./models/pattern";
import { Koi, initModel as initKoi, KoiAttributes } from "./models/koi";
import { CommunitySpreadsheet, Overview, SpreadsheetKoi } from "../google/communitySpreadsheet";
import associate from "./associations/patternHasManyKoi";

export default async function initModels(sequelize: Sequelize): Promise<void>
{
    // initialize the models
    initUser(sequelize);
    initPattern(sequelize);
    initKoi(sequelize);

    // initialize the associations
    associate();

    // create the tables if they don't exist yet
    for (const Model of [User, Pattern, Koi])
    {
        try
        {
            await Model.sync()
        }
        catch(error)
        {
            throw new RethrownError(
                `Could not initialize the ${Model.name} table.`, error
            );
        }
    }


    // add data to the tables
    await populatePatterns();
    await populateKois();
}

async function populatePatterns(): Promise<void>
{
    const OVERVIEW_SHEET: Overview = await CommunitySpreadsheet.getOverview();
    let patterns: PatternAttributes[] = [];
    for (const ROW of OVERVIEW_SHEET)
    {
        patterns.push({
            name: ROW.name, 
            type: ROW.type,
            hatchTime: ROW.hatchTime == undefined ? null : ROW.hatchTime
        });
    }
    await Pattern.bulkCreate(patterns, { ignoreDuplicates: true } );
}

async function populateKois(): Promise<void>
{
    const KOIS: SpreadsheetKoi[] = await CommunitySpreadsheet.getKois();
    let kois: KoiAttributes[] = [];
    for (const KOI of KOIS)
    {
        kois.push({
            name: KOI.name,
            rarity: KOI.rarity,
            pattern: KOI.pattern
        });
    }
    await Koi.bulkCreate(kois, { ignoreDuplicates: true });
}