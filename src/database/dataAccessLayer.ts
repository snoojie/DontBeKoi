import { Op } from "sequelize";
import ErrorMessages from "../errorMessages";
import UserSpreadsheet from "../google/userSpreadsheet";
import { Rarity } from "../types";
import PublicError from "../util/publicError";
import { Koi } from "./models/koi";
import { Pattern } from "./models/pattern";
import { User } from "./models/user";

export type UsersMissingKoiResponse = {
    discordIds: string[];
    rarity: Rarity;
    hatchTime?: number;
    discordIdsMissingPattern: string[];
}

export const DataAccessLayer = {
    
    /**
     * Saves the user to the database. 
     * If discord ID is already in the database, 
     * the user's name and spreadsheet ID are updated.
     * Otherwise, a new user is created.
     * @param discordId User's discord ID
     * @param name User's name on discord
     * @param spreadsheetId Google spreadsheet ID 
     * @throws if the user could not be saved to the database.
     */
    saveUser: async function(
        discordId: string, name: string, spreadsheetId: string
    ): Promise<void>
    {   
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
     * @throws PublicError if the pattern or color is not valid.
     */
    getUsersMissingKoi: async function(
        koiName: string, patternName: string
    ): Promise<UsersMissingKoiResponse>
    {        
        // find the pattern and confirm it's valid
        const PATTERN: Pattern | null = await Pattern.findOne({
             where: { name: { [Op.iLike]: patternName } },
             include: [ Pattern.associations.kois ]
        });
        if (!PATTERN)
        {
            throw new PublicError(`Pattern ${patternName} does not exist.`);
        }
        if (!PATTERN.kois)
        {
            throw new Error(
                `Pattern ${patternName} has no colors. How did this happen?`
            );
        }

        // find the koi and confirm it's valid
        let koi: Koi | undefined;
        const KOI_NAME_LOWERCASE: string = koiName.toLowerCase();
        for (const KOI of PATTERN.kois)
        {
            if (KOI.name.toLowerCase() == KOI_NAME_LOWERCASE)
            {
                // found it!
                koi = KOI;
                break;
            }
        }
        if (!koi)
        {
            throw new PublicError(
                `Pattern ${patternName} does not have color ${koiName}.`
            );
        }

        // get the users who do not have this koi
        let promises: Promise<void>[] = [];
        let discordUsers: string[] = [];
        let discordUsersMissingPattern: string[] = [];
        const USERS: User[] = await User.findAll();
        for (const USER of USERS)
        {
            promises.push(
                UserSpreadsheet.hasKoi(
                    USER.spreadsheetId, koiName, patternName, PATTERN.type
                )
                .catch(error => {
                    // The user may have forgotten to add this pattern to 
                    // their spreadsheet, maybe because it's a brand new pattern.
                    // Or, their spreadsheet is broken. Either way, make sure they are
                    // aware they need to update their sheet.
                    if (error instanceof Error)
                    {
                        if (error.message.startsWith(ErrorMessages.USER_SPREADSHEET.PATTERN_DOES_NOT_EXIST))
                        {
                            discordUsersMissingPattern.push(USER.discordId);
                            return true;
                        }
                    }

                    // this error was caused for another reason.
                    // keep throwing it up.
                    throw error;
                })
                .then(hasKoi => {
                    if (!hasKoi)
                    {
                        discordUsers.push(USER.discordId)
                    }
                })
            );
        }

        await Promise.all(promises);
        
        return {
            discordIds: discordUsers,
            rarity: koi.rarity,
            hatchTime: PATTERN.hatchTime ? PATTERN.hatchTime : undefined,
            discordIdsMissingPattern: discordUsersMissingPattern
        };
    }
}