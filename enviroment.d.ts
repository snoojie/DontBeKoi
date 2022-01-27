declare global 
{
    namespace NodeJS 
    {
        interface ProcessEnv 
        {
            BOT_TOKEN: string | undefined;
            CLIENT_ID: string | undefined;
            GUILD_ID: string | undefined;
            DATABASE_URL: string | undefined;
            GOOGLE_API_KEY: string | undefined;
        }
    }
}

export {};