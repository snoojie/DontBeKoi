const ErrorMessages = 
{
    BOT: {

        ALREADY_RUNNING: "Cannot start the bot. It is already running.",

        FAILED_LOGIN: "Could not login to discord. Invalid token.",
        
    },

    DATABASE: {

        ALREADY_RUNNING: "Cannot start the database. It is already running.",

        FAILED_CONNECTION: "Could not connect to database. " +
            "Could the database URL be wrong?",

        CANNOT_INITIALIZE_KOI: "Could not associate Pattern to Koi. " +
            "Did you forget to inititalize Pattern before initializing Koi?",

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
            "Failed to deploy commands. Could the client ID or guild ID be wrong?",

        UNKNOWN_INTERACTON: "Cannot respond to interaction because it is not a command.",
        
        UNKNOWN_COMMAND: 
            "Cannot respond to interaction because it is an unknown command.",

        FAILED_COMMAND_EXECUTION: "Error while executing the command."

    },

    CONFIG: {

        MISSING_ENVIRONMENT_VARIABLE: 
            "Did you forget to set the following key as an environment variable?"
            
    },

    SPREADSHEET: {

        INVALID_GOOGLE_API_KEY: "Invalid Google API key.",

        CANNOT_GET_SPREADSHEET: "Cannot read the spreadsheet. " +
            "Could the Google API key, spreadsheet ID, or range be wrong?",

        CANNOT_GET_VALUES: "Cannot get values. Could the range be wrong?"
    },

    USER_SPREADSHEET: {

        PATTERN_DOES_NOT_EXIST: "Could not find pattern in the spreadsheet.",

        COLOR_DOES_NOT_EXIST: "Found the pattern in the spreadsheet but not the color."

    }

}

export default ErrorMessages;