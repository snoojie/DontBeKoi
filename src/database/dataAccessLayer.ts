import { Op } from "sequelize";
import { UserSpreadsheet } from "../google/userSpreadsheet";
import { Rarity } from "../types";
import RethrownError from "../util/rethrownError";
import { Koi } from "./models/koi";
import { Pattern } from "./models/pattern";
import { User } from "./models/user";

export type UsersMissingKoiResponse = {
    error?: string;
    data?: {
        discordIds: string[];
        rarity: Rarity;
    };
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
        let user: User | null;
        try {
            user = await User.findOne({ where: { discordId } });
        }
        catch(error)
        {
            throw new RethrownError(
                "Could not query User table by discord ID. " +
                "Could the table be set up incorrectly?",
                error
            );
        }
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
            return { error: `Pattern ${patternName} does not exist.` };
        }
        if (!PATTERN.kois)
        {
            throw new Error(`Pattern ${patternName} has no colors.`);
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
            return { error : `Pattern ${patternName} does not have color ${koiName}.` };
        }

        let discordUsers: string[] = [];

        const USERS: User[] = await User.findAll();
        for (const USER of USERS)
        {
            const HAS_KOI: boolean = await UserSpreadsheet.hasKoi(
                USER.spreadsheetId, koiName, patternName, PATTERN.type
            );
            if (!HAS_KOI)
            {
                discordUsers.push(USER.discordId);
            }
        }
        
        return { data: { 
            discordIds: discordUsers,
            rarity: koi.rarity
        } };
    }
}