// references: 
// https://stackoverflow.com/a/41407246

import { DatabaseError } from "sequelize";

// https://www.lihaoyi.com/post/BuildyourownCommandLinewithANSIescapecodes.html#colors
enum Color
{
    GREEN    = "\x1b[32m%s\x1b[0m",
    RED      = "\x1b[31m%s\x1b[0m",
    RED_GREY = "\x1b[38;5;131m%s\x1b[0m"
};

enum Theme
{
    LOG        = Color.GREEN,
    ERROR      = Color.RED,
    STACKTRACE = Color.RED_GREY
};

const Logger = {
    
    /**
     * Replacement to console.log
     * @param message message to print
     */
    log: function(message: any): void
    {
        console.log(Theme.LOG, message);
    },

    /**
     * Replacement to console.error
     * @param message Quick message to describe the error
     * @param error Error itself
     */
    error: function(error: any): void
    {
        if (error instanceof Error)
        {
            // normally, the first line of an error stack looks like
            // Error: some message here
            // but, sequelize just does 
            // Error
            // which is useless
            // so, for sequelize, we need to manually create the first line
            // also, for sequelize, we should print the sql

            console.log(Theme.ERROR, error.name + ": " + error.message);

            if (error instanceof DatabaseError)
            {
                console.log(Theme.ERROR, "SQL: " + error.sql);
            }

            if (error.stack)
            {
                for (const STEP of error.stack.split("\n").slice(1))
                {
                    const THEME: Theme = STEP.startsWith("    at ") 
                        ? Theme.STACKTRACE 
                        : Theme.ERROR;
                    console.log(THEME, STEP);
                }
            }
        }

        // if error isn't of type Error, it's likely a string
        else
        {
            console.log(Theme.ERROR, error);
        }
    }
}

export default Logger;