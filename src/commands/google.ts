import { CommandInteraction } from "discord.js";
import { Command } from "../command";
import UserDal from "../db/user";

const Google: Command = {

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

        // save this user with the spreadsheet ID in the database
        try {
            await UserDal.saveUser(
                interaction.user.id, interaction.user.username, SPREADSHEET_ID
            );
        } catch(error)
        {
            return "todo";
        }

        return `Updated your spreadsheet to ${SPREADSHEET_ID}`;
    }

};

export default Google;