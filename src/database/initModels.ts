import { Sequelize } from "sequelize";
import { initModel as initUser } from "./models/user";
import { Pattern, initModel as initPattern, PatternAttributes } from "./models/pattern";
import { Koi, initModel as initKoi, KoiAttributes } from "./models/koi";
import { CommunitySpreadsheet, Pattern as SpreadsheetPattern } 
    from "../google/communitySpreadsheet";

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

    // add data to the tables
    const SPREADSHEET_PATTERNS: SpreadsheetPattern[] = 
        await CommunitySpreadsheet.getAllPatterns();
    await populatePatterns(SPREADSHEET_PATTERNS);
    await populateKois(SPREADSHEET_PATTERNS);
}

async function populatePatterns(spreadsheetPatterns: SpreadsheetPattern[]): Promise<void>
{
    let patterns: PatternAttributes[] = [];
    for (const SPREADSHEET_PATTERN of spreadsheetPatterns)
    {
        patterns.push({
            name: SPREADSHEET_PATTERN.name, 
            type: SPREADSHEET_PATTERN.type,
            hatchTime: 
                SPREADSHEET_PATTERN.hatchTime ? SPREADSHEET_PATTERN.hatchTime : null
        });
    }
    await Pattern.bulkCreate(patterns, { updateOnDuplicate: [ "hatchTime" ] } );
}

async function populateKois(spreadsheetPatterns: SpreadsheetPattern[]): Promise<void>
{
    let kois: KoiAttributes[] = [];
    for (const SPREADSHEET_PATTERN of spreadsheetPatterns)
    {
        for (const SPREADSHEET_KOI of SPREADSHEET_PATTERN.kois)
        kois.push({
            name: SPREADSHEET_KOI.name,
            rarity: SPREADSHEET_KOI.rarity,
            patternName: SPREADSHEET_PATTERN.name
        });
    }
    await Koi.bulkCreate(kois, { ignoreDuplicates: true });
}