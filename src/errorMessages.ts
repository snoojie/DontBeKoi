const ErrorMessages = 
{
    BOT: {

        ALREADY_RUNNING: "Cannot start the bot. It is already running.",

        FAILED_LOGIN: "Could not login to discord. Invalid token.",
        
    },

    DATABASE: {

        INVALID_DATABASE_URL: "Could not connect to the database. Invalid URL."

    },

    COMMAND_MANAGER: {

        MISSING_COMMANDS_DIRECTORY: 
            "Cannot initialize commands. The commands directory is missing.",

        CANNOT_IMPORT_COMMAND_SCRIPT:
            "Cannot initialize command. Error importing its script.",

        COMMAND_SCRIPT_MISSING_DEFAULT_EXPORT: 
            "Cannot initialize command without a default export.",

        IS_NOT_COMMAND:
            "Cannot initialize command when it is not actually a command.",

        DUPLICATE_COMMAND: "Cannot initialize commands with duplicate names.",

        CANNOT_BUILD_COMMAND: "Failed to build a command for deployment.",

        FAILED_COMMAND_DEPLOYMENT: 
            "Failed to deploy commands. Could the client ID or guild ID be wrong?"

    },

    CONFIG: {

        MISSING_ENVIRONMENT_VARIABLE: 
            "Did you forget to set the following key as an environment variable?"
            
    }

}

export default ErrorMessages;