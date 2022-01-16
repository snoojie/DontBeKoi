import * as dotenv from "dotenv";

// init environment variables
dotenv.config();

export class Config
{
    public static getBotToken(): string
    {
        const TOKEN: string = process.env.BOT_TOKEN;
        if (!TOKEN)
        {
            throw new Error("Did you forget to set BOT_TOKEN in .env file?");
        }
        return TOKEN;
    }
}