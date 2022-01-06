declare global {
    namespace NodeJS {
        interface ProcessEnv {
            BOT_TOKEN: string;
            CLIENT_ID: string;
            GUILD_ID: string;
            CATEGORY_ID: string;
            GOOGLE_API_KEY: string;
            GOOGLE_CLIENT_SECRET: string;
            GOOGLE_CLIENT_ID: string;
            GOOGLE_REDIRECT_URI: string;
            GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
            GOOGLE_SERVICE_ACCOUNT_KEY: string;
        }
    }
}

export {};
