import { UserSpreadsheet } from "../google/userSpreadsheet";
import RethrownError from "../util/rethrownError";
import { Pattern } from "./models/pattern";
import { User } from "./models/user";

const DataAccessLayer = {
    
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

    validatePattern: async function(patternName: string): Promise<boolean>
    {
        const PATTERN: Pattern | null = 
            await Pattern.findByCaseInsensitiveName(patternName, false);

        return PATTERN != null;
    },

    validateKoi: async function(koiName: string, patternName: string): Promise<boolean>
    {
        const PATTERN: Pattern | null = 
            await Pattern.findByCaseInsensitiveName(patternName, true);
        
        // confirm pattern exists
        if (!PATTERN)
        {
            return false;
        }

        // confirm the color for this pattern exists
        if (!doesPatternHaveKoi(PATTERN, koiName))
        {
            return false;
        }

        // this koi exists
        return true;
    },

    getDiscordUsersMissingKoi: async function(
        koiName: string, patternName: string
    ): Promise<string[]>
    {
        // confirm the pattern and color exist
        const PATTERN: Pattern | null = 
            await Pattern.findByCaseInsensitiveName(patternName, true);
        if (!PATTERN)
        {
            throw new Error(`Pattern ${patternName} does not exist.`);
        }
        if (!doesPatternHaveKoi(PATTERN, koiName))
        {
            throw new Error(`Pattern ${patternName} does not have color ${koiName}.`);
        }

        let discordUsers: string[] = [];

        const USERS: User[] = await User.findAll();
        for (const USER of USERS)
        {
            const HAS_KOI: boolean = await UserSpreadsheet.hasKoi(
                USER.spreadsheetId, koiName, patternName, PATTERN.type
            );
            console.log(HAS_KOI);
            if (!HAS_KOI)
            {
                discordUsers.push(USER.discordId);
            }
        }
        
        return discordUsers;
    }
}

export default DataAccessLayer;

function doesPatternHaveKoi(pattern: Pattern, koiName: string): boolean
{
    const KOI_NAME_LOWERCASE: string = koiName.toLowerCase();
    if (!pattern.kois?.find(koi => koi.name.toLowerCase() == KOI_NAME_LOWERCASE))
    {
        return false;
    }
    return true;
}