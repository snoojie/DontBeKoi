import { CommandInteraction } from "discord.js";
import { Command } from "../command";
import UserDal from "../database/dataAccessLayers/user";
import Google from "../google/google";
import RethrownError from "../util/rethrownError";

const GoogleCommand: Command = {

    name: "google",

    description: "Register your google spreadsheet.",

    options: [{
        name: "spreadsheet",
        description: "ID of your google spreadsheet"
    }],

    isPrivate: true,
    
    execute: async function (interaction: CommandInteraction): Promise<string> {

        // get the value of the spreadsheet option
        const SPREADSHEET_ID: string = interaction.options.getString("spreadsheet") || "";

        // make sure this is a valid spreadsheet
        try 
        {
            const IS_SPREADSHEET_VALID: boolean = 
                await Google.validateSpreadsheetId(SPREADSHEET_ID);
            if (!IS_SPREADSHEET_VALID)
            {
                return `Spreadsheet ID ${SPREADSHEET_ID} is not valid. ` +
                    `You can find the ID in the URL. For example, spreadsheet ` +
                    `<https://docs.google.com/spreadsheets/d/1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo/edit?usp=sharing> ` +
                    `has ID 1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo`;
            }
        }
        catch(error)
        {
            throw new RethrownError(
                "Could not register spreadsheet due to an issue when validating it: " +
                SPREADSHEET_ID, 
                error
            );
        }

        // save this user with the spreadsheet ID in the database
        try {
            await UserDal.saveUser(
                interaction.user.id, interaction.user.username, SPREADSHEET_ID
            );
        } catch(error)
        {
            throw new RethrownError(
                "Could not register spreadsheet due to issue saving user.", error
            );
        }

        return `Updated your spreadsheet to ${SPREADSHEET_ID}`;
    }

};

export default GoogleCommand;