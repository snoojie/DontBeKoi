import * as dotenv from "dotenv";

// init environment variables
console.log("setting config");
dotenv.config();

export class Config
{

    /**
     * @returns Discord bot token.
     * @throws If bot token is not configured.
     */
    public static getBotToken(): string
    {
        const TOKEN: string | undefined = process.env.BOT_TOKEN;
        if (!TOKEN)
        {
            throw new Error(
                "Did you forget to set BOT_TOKEN as an environment variable?"
            );
        }
        return TOKEN;
    }
}