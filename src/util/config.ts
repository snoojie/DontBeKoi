import * as dotenv from "dotenv";
import EnhancedError from "./enhancedError";

/**
 * Error thrown when an environment variable was not found.
 */
export class ConfigError extends EnhancedError
{
    constructor(envKey: string)
    {
        super(`Did you forget to set ${envKey} as an environment variable?`);
    }
}

// init environment variables
dotenv.config();

function get(key: string): string
{
    const VALUE: string | undefined = process.env[key];
    if (!VALUE)
    {
        throw new ConfigError(key)
    }
    return VALUE;
}

export const Config = {
    
    /**
     * @returns Discord bot token.
     * @throws If BOT_TOKEN is not set as an environment variable.
     */
    getBotToken: function(): string 
    { 
        return get("BOT_TOKEN");
    },

    /**
     * @returns Client ID of the bot.
     * @throws If CLIENT_ID is not set as an environment variable
     */
    getClientId: function(): string 
    { 
        return get("CLIENT_ID");
    },

    /**
     * @returns Guild ID of the discord server the bot is in.
     * @throws If GUILD_ID is not set as an environment variable
     */
    getGuildId: function(): string 
    { 
        return get("GUILD_ID");
    },

    /**
     * @returns The database URL.
     * @throws If DATABASE_URL is not set as an environment variable
     */
    getDatabaseUrl: function(): string 
    { 
        return get("DATABASE_URL");
    },

    /**
     * @returns The database URL.
     * @throws If DATABASE_URL is not set as an environment variable
     */
    getGoogleApiKey: function(): string 
    { 
        return get("GOOGLE_API_KEY");
    }
}