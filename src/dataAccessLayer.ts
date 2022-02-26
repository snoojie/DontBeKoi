import { Op } from "sequelize";
import type { Rarity } from "./types";
import EnhancedError from "./util/enhancedError";
import Logger from "./util/logger";
import { Database } from "./database/database";
import { Koi, type KoiAttributes } from "./database/models/koi";
import { Pattern, type PatternAttributes } from "./database/models/pattern";
import { User } from "./database/models/user";
import { SpreadsheetNotFound, PrivateSpreadsheet, Spreadsheet, RangeNotFound } 
    from "./google/spreadsheet";
import { KoiSpreadsheetError } from "./google/koiSpreadsheet";
import { KoiNotInSpreadsheet, PatternNotInSpreadsheet, UnknownKoiProgress, 
         UserSpreadsheet } from "./google/userSpreadsheet";
import { CommunitySpreadsheet, type Pattern as SpreadsheetPattern } 
    from "./google/communitySpreadsheet";

export class DataAccessLayerError extends EnhancedError {}

export class NeitherPatternFound extends DataAccessLayerError
{
    constructor(pattern1: string, pattern2: string)
    {
        super(`Neither '${pattern1}' nor '${pattern2}' are valid patterns.`);
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
    discordIdsWithSpreadsheetErrors: {
        spreadsheetNotFound: string[],
        privateSpreadsheet: string[],
        formatBroken: string[],
        patternNotFound: string[],
        koiNotFound: string[]
    };
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
     * and all patterns' koi names and their rarity (common or rare).
     * @returns List of new patterns that were added.
     */
    updatePatterns: async function(): Promise<string[]>
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
        const BULK_CREATED_KOIS: Koi[] = await Koi.bulkCreate(kois, { ignoreDuplicates: true });
        
        // Get list of new patterns.
        // Note that sequelize does not provide a convenient way of 
        // getting the new or updated records.
        // Instead, we can cheat by looking at the list of records bulkCreate returns.
        // If the id property of a record is not null, then it's a new record. 
        // Since our patterns table doesn't have an id property, but koi table does, 
        // we will look at kois.
        let newPatterns: string[] = []
        for (const KOI of BULK_CREATED_KOIS)
        {
            if (KOI.get("id") != null && newPatterns.indexOf(KOI.get("patternName")) < 0)
            {
                // this is a new koi, and we have not yet marked this as a new pattern
                newPatterns.push(KOI.get("patternName"));
            }
        }

        return newPatterns;
    },

    /**
     * Saves the user to the database. 
     * If discord ID is already in the database, 
     * the user's name and spreadsheet ID are updated.
     * Otherwise, a new user is created.
     * @param discordId User's discord ID
     * @param name User's name on discord
     * @param spreadsheetId Google spreadsheet ID 
     * @throws ConfigError if the Google API key is not set in environment variables.
     * @throws InvalidGoogleApiKey if the Google API key is invalid.
     * @throws SpreadsheetNotFound if the spreadsheet does not exist.
     * @throws PrivateSpreadsheet if the spreadsheet is not shared to anyone with link.
     */
    saveUser: async function(
        discordId: string, name: string, spreadsheetId: string
    ): Promise<void>
    {   
        // validate spreadsheet
        await Spreadsheet.validate(spreadsheetId);

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
     * The two parameters, name1 and name2, accept the koi name and pattern name.
     * This allows the caller to be unaware of which name is which.
     * @param name1 Name of the koi or name of the pattern.
     * @param name2 Name of the koi or name of the pattern.
     * @returns list of discord IDs and the rarity of the koi.
     * @throws NeitherPatternFound if neither name1 nor name2 are patterns.
     * @throws KoiNotFound if the pattern does not have the specified koi.
     */
    getUsersMissingKoi: async function(
        name1: string, name2: string): Promise<UsersMissingKoiResponse>
    {
        // note we can assume that no koi name can be a pattern name
        // at least that was true at one point...

        // first we assume name1 is the koi name, and name2 is the pattern name
        // confirm that
        let koiName = name1;
        let patternName = name2;
        let pattern: Pattern | null = await Pattern.findOne({
            where: { name: { [ Op.iLike]: patternName }},
            include: [ Pattern.associations.kois ]
        });
        if (!pattern)
        {
            // nope, name2 is not a pattern. try name1
            koiName = name2;
            patternName = name1;
            pattern = await Pattern.findOne({
                where: { name: { [ Op.iLike]: patternName }},
                include: [ Pattern.associations.kois ]
            });
        }
        if (!pattern)
        {
            // neither was a pattern
            throw new NeitherPatternFound(name1, name2);
        }

        // yay we found the pattern!
        // check the koi name is valid
        let koi: Koi | undefined;
        for (const KOI of pattern.kois!)
        {
            if (KOI.name.toLowerCase() == koiName.toLowerCase())
            {
                // found it!
                koi = KOI;
                break;
            }
        }
        if (!koi)
        {
            // pattern was valid, but koi was not
            throw new KoiNotFound(koiName, patternName);
        }

        // Start setting up the reply. We have info on rarity and hatch time at least.
        let usersMissingKoi: UsersMissingKoiResponse = {
            discordIds: [],
            rarity: koi.rarity,
            hatchTime: pattern.hatchTime ? pattern.hatchTime : undefined,
            discordIdsWithSpreadsheetErrors: {
                spreadsheetNotFound: [],
                privateSpreadsheet: [],
                formatBroken: [],
                patternNotFound: [],
                koiNotFound: []
            }
        };

        // Get the users who do not have this koi.
        // Note we need a list of promises so we know 
        // when we are done checking each user.
        let hasKoiPromises: Promise<void>[] = [];
        const USERS: User[] = await User.findAll();
        for (const USER of USERS)
        {
            hasKoiPromises.push(UserSpreadsheet.hasKoi(
                USER.spreadsheetId, koiName, patternName, pattern.type
            )
                .then(hasKoi => {
                    if (!hasKoi)
                    {
                        usersMissingKoi.discordIds.push(USER.discordId)
                    }
                })
                .catch(error => {
                    
                    // log the issue to help the person if they need it
                    Logger.error(`${USER.name} has an issue their spreadsheet.`);
                    Logger.error(error);

                    // Let the user know if their spreadsheet has been deleted
                    if(error instanceof SpreadsheetNotFound)
                    {
                        usersMissingKoi
                            .discordIdsWithSpreadsheetErrors
                            .spreadsheetNotFound.push(USER.discordId);
                        return;
                    }

                    // Let the user know if their spreadsheet is private
                    if(error instanceof PrivateSpreadsheet)
                    {
                        usersMissingKoi
                            .discordIdsWithSpreadsheetErrors
                            .privateSpreadsheet.push(USER.discordId);
                        return;
                    }

                    // The user may have forgotten to add this pattern to 
                    // their spreadsheet, maybe because it's a brand new pattern.
                    if (error instanceof PatternNotInSpreadsheet)
                    {
                        usersMissingKoi
                            .discordIdsWithSpreadsheetErrors
                            .patternNotFound.push(USER.discordId);
                        return;
                    }

                    // The user may have the pattern in their spreadsheet, 
                    // but not the koi. If this happens it could be a typo.
                    if (error instanceof KoiNotInSpreadsheet)
                    {
                        usersMissingKoi
                            .discordIdsWithSpreadsheetErrors
                            .koiNotFound.push(USER.discordId);
                        return;
                    }

                    // let the user know if something is wrong with their spreadsheet,
                    // such as extra empty rows, or renamed sheets
                    if (error instanceof KoiSpreadsheetError || 
                        error instanceof RangeNotFound ||
                        error instanceof UnknownKoiProgress)
                    {
                        usersMissingKoi
                            .discordIdsWithSpreadsheetErrors
                            .formatBroken.push(USER.discordId);
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