import * as dotenv from "dotenv";

// init environment variables
dotenv.config();

export class Config
{

    /**
     * @returns Discord bot token.
     * @throws If bot token is not configured.
     */
    public static getBotToken(): string
    {
        const TOKEN: string = process.env.BOT_TOKENd;
        if (!TOKEN)
        {
            throw new Error("Did you forget to set BOT_TOKEN in .env file?");
        }
        return TOKEN;
    }
}