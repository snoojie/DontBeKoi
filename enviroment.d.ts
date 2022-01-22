declare global 
{
    namespace NodeJS 
    {
        interface ProcessEnv 
        {
            BOT_TOKEN: string | undefined;
            CLIENT_ID: string | undefined;
            GUILD_ID: string | undefined;
        }
    }
}

export {};