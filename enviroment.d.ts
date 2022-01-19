declare global 
{
    namespace NodeJS 
    {
        interface ProcessEnv 
        {
            BOT_TOKEN: string | undefined;
        }
    }
}

export {};