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
        const PATTERN: Pattern | null = await Pattern.findOne({ 
            where: { name: patternName }
        });

        return PATTERN != null;
    },

    validateKoi: async function(koiName: string, patternName: string): Promise<boolean>
    {
        const PATTERN: Pattern | null = await Pattern.findOne({ 
            where: { name: patternName },
            include: [ Pattern.associations.kois ]
        });
        
        // confirm pattern exists
        if (!PATTERN)
        {
            return false;
        }

        // confirm the color for this pattern exists
        if (!PATTERN.kois?.find(koi => koi.name == koiName))
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
        const PATTERN: Pattern | null = await Pattern.findOne({ 
            where: { name: patternName },
            include: [ Pattern.associations.kois ]
        });
        
        // confirm pattern exists
        if (!PATTERN)
        {
            throw new Error(`Pattern ${patternName} does not exist.`);
        }

        // confirm the color for this pattern exists
        if (!PATTERN.kois?.find(koi => koi.name == koiName))
        {
            throw new Error(`Pattern ${patternName} does not have color ${koiName}.`);
        }

        
        let discordUsers: string[] = [];
        return discordUsers;
    }
}

export default DataAccessLayer;