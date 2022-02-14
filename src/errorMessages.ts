const ErrorMessages = 
{
    DATABASE: {

        ALREADY_RUNNING: "Cannot start the database. It is already running.",

        FAILED_CONNECTION: "Could not connect to database. " +
            "Could the database URL be wrong?",

        CANNOT_INITIALIZE_KOI: "Could not associate Pattern to Koi. " +
            "Did you forget to inititalize Pattern before initializing Koi?",

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