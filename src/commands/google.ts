import type { CommandInteraction } from "discord.js";
import type { Command } from "../command";
import { DataAccessLayer } from "../dataAccessLayer";
import { PrivateSpreadsheet, SpreadsheetNotFound } from "../spreadsheets/spreadsheet";

const GoogleCommand: Command = {

    name: "google",

    description: "Register your google spreadsheet.",

    options: [{
        name: "spreadsheet",
        description: "ID of your google spreadsheet."
    }],

    isPrivate: true,
    
    execute: async function (interaction: CommandInteraction): Promise<string> 
    {

        // get the value of the spreadsheet option
        const SPREADSHEET_ID: string = interaction.options.getString("spreadsheet")!;

        // save this user with the spreadsheet ID in the database
        try 
        {
            await DataAccessLayer.saveUser(
                interaction.user.id, interaction.user.username, SPREADSHEET_ID
            );
        } 
        catch(error)
        {
            // let the user know if the spreadsheet does not exist
            if(error instanceof SpreadsheetNotFound)
            {
                return `Spreadsheet ID ${SPREADSHEET_ID} is not valid. ` +
                "You can find the ID in the URL. For example, spreadsheet " +
                "<https://docs.google.com/spreadsheets/d/1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo/edit?usp=sharing> " +
                "has ID 1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo"
            }

            // let the user know if the spreadsheet is private
            if(error instanceof PrivateSpreadsheet)
            {
                return `Spreadsheet ID ${SPREADSHEET_ID} is private. ` +
                "Share it so that anyone with the link can view it.";
            }

            // if there is another error, throw it up the chain,
            // as it is not expected
            throw error;
        }

        // let the user know that their spreadsheet has been saved
        return `Updated your spreadsheet to ${SPREADSHEET_ID}`;
    }

};

export default GoogleCommand;