import { Op } from "sequelize";
import { Database } from "./database/database";
import { Koi, KoiAttributes } from "./database/models/koi";
import { Pattern, PatternAttributes } from "./database/models/pattern";
import { User } from "./database/models/user";
import { CommunitySpreadsheet, Pattern as SpreadsheetPattern } 
    from "./google/communitySpreadsheet";
import { Spreadsheet, SpreadsheetNotFound as SpreadsheetNotFoundInSpreadsheet } 
    from "./google/spreadsheet";
import { PatternNotFound as PatterNotFoundInSpreadsheet, UserSpreadsheet } 
    from "./google/userSpreadsheet";
import { Rarity } from "./types";
import EnhancedError from "./util/enhancedError";

export class DataAccessLayerError extends EnhancedError {}

export class SpreadsheetNotFound extends DataAccessLayerError 
{
    constructor(spreadsheetId: string)
    {
        super(
            `Spreadsheet ID ${spreadsheetId} is not valid. ` +
            "You can find the ID in the URL. For example, spreadsheet " +
            "<https://docs.google.com/spreadsheets/d/1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo/edit?usp=sharing> " +
            "has ID 1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo"
        );
    }
}

export class PatternNotFound extends DataAccessLayerError 
{
    constructor(pattern: string)
    {
        super(`Pattern '${pattern}' does not exist.`);
    }
}

export class KoiNotFound extends DataAccessLayerError 
{
    constructor(koi: string, pattern: string)
    {
        super(`Pattern '${pattern}' does not have koi '${koi}'.`);
    }
}

export interface UsersMissingKoiResponse
{
    discordIds: string[];
    rarity: Rarity;
    hatchTime?: number;
    discordIdsMissingPattern: string[];
    discordIdsWithInvalidSpreadsheet: string[];
}

/**
 * Layer that retrieves/inserts/updates data from any source, 
 * including the database and google spreadsheets.
 * This decouples the data source from other code, for example, 
 * it decouples the database from the commands.
 */
export const DataAccessLayer = 
{
    /**
     * Connect to the database and leave the connection open so that other
     * DataAccessLayer methods can use it.
     * @throws DatabaseError if the database is already running.
     * @throws InvalidDatabaseUrl if the database URL is invalid or
     *         not in the environment variables.
     */
     start: async function(): Promise<void>
     {
         // start the database
         await Database.start();
     },
 
     /**
      * Close the database connection.
      */
     stop: async function(): Promise<void>
     {
         await Database.stop();
     },

    /**
     * Gets the latest patterns and kois from Coris's google spreadsheet,
     * and adds them to our internal database. 
     * This includes the patterns' names, the type of pattern (progressive vs collector),
     * hatch times for collectors, 
     * and all patterns' koi names and their rarity (common or rare),
     */
    updatePatterns: async function(): Promise<void>
    {
        // get all patterns and kois to populate the database with
        const SPREADSHEET_PATTERNS: SpreadsheetPattern[] = 
            await CommunitySpreadsheet.getAllPatterns();

        // update the pattern table
        let patterns: PatternAttributes[] = [];
        for (const SPREADSHEET_PATTERN of SPREADSHEET_PATTERNS)
        {
            patterns.push({
                name: SPREADSHEET_PATTERN.name, 
                type: SPREADSHEET_PATTERN.type,
                hatchTime: 
                    SPREADSHEET_PATTERN.hatchTime ? SPREADSHEET_PATTERN.hatchTime : null
            });
        }
        // Note, there was an error once with Coris's spreadsheet where a pattern's 
        // hatch time column had incorrect info.
        // To fix that, we now update hatch time if it's different.
        await Pattern.bulkCreate(patterns, { updateOnDuplicate: [ "hatchTime" ] } );

        // update the koi table
        let kois: KoiAttributes[] = [];
        for (const SPREADSHEET_PATTERN of SPREADSHEET_PATTERNS)
        {
            for (const SPREADSHEET_KOI of SPREADSHEET_PATTERN.kois)
            kois.push({
                name: SPREADSHEET_KOI.name,
                rarity: SPREADSHEET_KOI.rarity,
                patternName: SPREADSHEET_PATTERN.name
            });
        }
        await Koi.bulkCreate(kois, { ignoreDuplicates: true });
    },

    /**
     * Saves the user to the database. 
     * If discord ID is already in the database, 
     * the user's name and spreadsheet ID are updated.
     * Otherwise, a new user is created.
     * @param discordId User's discord ID
     * @param name User's name on discord
     * @param spreadsheetId Google spreadsheet ID 
     * @throws SpreadsheetNotFound if the spreadsheet does not exist.
     */
    saveUser: async function(
        discordId: string, name: string, spreadsheetId: string
    ): Promise<void>
    {   
        // confirm the spreadsheet is valid
        if (!(await Spreadsheet.exists(spreadsheetId)))
        {
            throw new SpreadsheetNotFound(spreadsheetId);
        }

        // if the user already exists in the database, 
        // update their name and spreadsheet ID
        let user: User | null = await User.findOne({ where: { discordId } });
        if (user)
        {
            user.name = name;
            user.spreadsheetId = spreadsheetId;
        }

        // otherwise, create a new user
        else
        {
            user = User.build({ discordId, name, spreadsheetId });
        }

        // save the user in the database
        await user.save();
    },

    /**
     * Get everyone who does not have this specific koi.
     * @param koiName Name of the koi, ie, its color.
     * @param patternName Name of the koi's pattern.
     * @returns list of discord IDs and the rarity of the koi.
     * @throws PatternNotFound if the pattern does not exist.
     * @throws KoiNotFound if the pattern does not have the specified koi.
     * @throws DataAccessLayerError if the pattern has no known kois 
     *         which should never happen.
     */
    getUsersMissingKoi: async function(
        koiName: string, patternName: string): Promise<UsersMissingKoiResponse>
    {        

        // find the pattern and confirm it's valid
        const PATTERN: Pattern | null = await Pattern.findOne({
             where: { name: { [Op.iLike]: patternName } },
             include: [ Pattern.associations.kois ]
        });
        if (!PATTERN)
        {
            throw new PatternNotFound(patternName);
        }
        if (!PATTERN.kois)
        {
            throw new DataAccessLayerError(
                `Pattern '${patternName}' has no colors. How did this happen?`
            );
        }

        // find the koi and confirm it's valid
        let koi: Koi | undefined;
        for (const KOI of PATTERN.kois)
        {
            if (KOI.name.localeCompare(koiName))
            {
                // found it!
                koi = KOI;
                break;
            }
        }
        if (!koi)
        {
            throw new KoiNotFound(koiName, patternName);
        }

        // Start setting up the reply. We have info on rarity and hatch time at least.
        let usersMissingKoi: UsersMissingKoiResponse = {
            discordIds: [],
            rarity: koi.rarity,
            hatchTime: PATTERN.hatchTime ? PATTERN.hatchTime : undefined,
            discordIdsMissingPattern: [],
            discordIdsWithInvalidSpreadsheet: []
        };

        // Get the users who do not have this koi.
        // Note we need a list of promises so we know 
        // when we are done checking each user.
        let hasKoiPromises: Promise<void>[] = [];
        const USERS: User[] = await User.findAll();
        for (const USER of USERS)
        {
            hasKoiPromises.push(
                UserSpreadsheet.hasKoi(USER.spreadsheetId, koiName, patternName)
                .then(hasKoi => {
                    if (!hasKoi)
                    {
                        usersMissingKoi.discordIds.push(USER.discordId)
                    }
                })
                .catch(error => {
                    
                    // The user may have forgotten to add this pattern to 
                    // their spreadsheet, maybe because it's a brand new pattern.
                    // Or, their spreadsheet is broken. Either way, make sure they are
                    // aware they need to update their sheet.
                    if (error instanceof PatterNotFoundInSpreadsheet)
                    {
                        usersMissingKoi.discordIdsMissingPattern.push(USER.discordId);
                        return;
                    }

                    // Let the user know if their spreadsheet cannot be read from.
                    // This is most likely due to read permission being revoked.
                    if(error instanceof SpreadsheetNotFoundInSpreadsheet)
                    {
                        usersMissingKoi.discordIdsWithInvalidSpreadsheet
                            .push(USER.discordId);
                        return;
                    }

                    // this error was caused for another reason so pass it on
                    throw error;
                })
            );
        }

        await Promise.all(hasKoiPromises);
        
        return usersMissingKoi;
    }
}