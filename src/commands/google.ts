import { CommandInteraction } from "discord.js";
import { Command } from "../command";
import { DataAccessLayer, SpreadsheetNotFound } from "../dataAccessLayer";

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
            // let the user know if the spreadsheet is not valid
            if(error instanceof SpreadsheetNotFound)
            {
                return error.message;
            }

            // if there is another error, throw it up the chain
            throw error;
        }

        // let the user know that their spreadsheet has been saved
        return `Updated your spreadsheet to ${SPREADSHEET_ID}`;
    }

};

export default GoogleCommand;