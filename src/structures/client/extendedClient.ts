import { Client, Intents } from "discord.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { ClientEvent } from "./clientEvent";
import { Command } from"../command/command";
import * as fs from "fs";
import { dbStart, Pattern } from "../../db/db";

export class ExtendedClient extends Client
{
    private commands: Map<String, Command>;

    constructor()
    {
        super({ intents: [Intents.FLAGS.GUILDS] });
    }

    public async start(): Promise<void>
    {
        await this.registerEvents();
        await this.registerCommands();
        
        try
        {   
            await this.registerData();
        } catch (error)
        {
            console.error(error);
        }
        await this.login(process.env.BOT_TOKEN);

    }

    public getCommand(name: string): Command | undefined
    {
        return this.commands.get(name);
    }

    protected async registerEvents(): Promise<void>
    {
        const EVENTS: ClientEvent[] = await loadScripts("events");
        for (const EVENT of EVENTS)
        {
            EVENT.start(this);
        }
    }

    protected async registerCommands(): Promise<void>
    {
        this.commands = new Map<string, Command>();
        
        const COMMANDS: Command[] = await loadScripts("commands");
        for (const COMMAND of COMMANDS)
        {
            this.commands.set(COMMAND.name, COMMAND);
        }

        // deploy slash commands to discord server
        let slashCommands = [];
        for (const COMMAND of COMMANDS)
        {
            slashCommands.push(COMMAND.getSlashCommandJson());
        }
        new REST({ version: "9" })
            .setToken(process.env.BOT_TOKEN!)
            .put(
                Routes.applicationGuildCommands(
                    process.env.CLIENT_ID!,
                    process.env.GUILD_ID!
                ), 
                { body: slashCommands }
            )
            .then(() => console.log("Registered slash commands."))
            .catch((error) => {
                console.error("Failed to register slash commands");
                console.error(error);
            });
    }

    protected async registerData(): Promise<void>
    {
        await dbStart();
        console.log("DB ready");
    }
}

async function loadScripts(directory: string): Promise<any[]>
{
    let scripts: any[] = [];

    let files = fs.readdirSync(`./src/${directory}`)
    for (let file of files)
    {
        file = file.slice(0,-3);
        let script = await import(`../../${directory}/${file}`);
        scripts.push(script.default);
    }

    return scripts;
}