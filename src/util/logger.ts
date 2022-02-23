// references: 
// https://stackoverflow.com/a/41407246

import { DatabaseError } from "sequelize";

// https://www.lihaoyi.com/post/BuildyourownCommandLinewithANSIescapecodes.html#colors
const COLOR =
{
    GREEN    : "\x1b[32m%s\x1b[0m",
    RED      : "\x1b[31m%s\x1b[0m",
    RED_GREY : "\x1b[38;5;131m%s\x1b[0m"
};

const THEME =
{
    LOG        : COLOR.GREEN,
    ERROR      : COLOR.RED,
    STACKTRACE : COLOR.RED_GREY
};

// View Logger.logPartial() comments for full details.
// When logging partial messages, 
// we need a flag specifying we are in a partial log state.
// This is so if there is an error in the middle of logging partials,
// the error will be printed on a newline.
let partialLogState: boolean = false;
function completePartialLog(): void
{
    if (partialLogState)
    {
        process.stdout.write("\n");
        partialLogState = false;
    }
}

const Logger = {
    
    /**
     * Replacement to console.log
     * @param message message to print
     */
    log: function(message: any): void
    {
        completePartialLog();

        console.log(THEME.LOG, message);
    },

    /**
     * Similar to Logger.log, except this does not print a newline at the end.
     * It is handy if you want to print on one line in several calls during execution.
     * To signal that all the "partials" are done, set done to true.
     * 
     * For example, the following calls
     * 
     * Logger.logPartial("some");
     * 
     * Logger.logPartial("thing");
     * 
     * will print the following:
     * 
     * something
     * @param message message to print
     * @param done default false. If true, a newline will be added at the end.
     */
    logPartial: function(message: any, done: boolean = false)
    {
        partialLogState = true;
        process.stdout.write(THEME.LOG.replace("%s", message));
        if (done)
        {
            completePartialLog();
        }
    },

    /**
     * Replacement to console.error
     * @param message Quick message to describe the error
     * @param error Error itself
     */
    error: function(error: any): void
    {
        completePartialLog();
        
        if (error instanceof Error)
        {
            // normally, the first line of an error stack looks like
            // Error: some message here
            // but, sequelize just does 
            // Error
            // which is useless
            // so, for sequelize, we need to manually create the first line
            // also, for sequelize, we should print the sql

            console.log(THEME.ERROR, error.name + ": " + error.message);

            if (error instanceof DatabaseError)
            {
                console.log(THEME.ERROR, "SQL: " + error.sql);
                console.log(
                    THEME.ERROR, 
                    "SQL parameters: " + JSON.stringify(error.parameters, null, 2)
                );
            }

            if (error.stack)
            {
                for (const STEP of error.stack.split("\n").slice(1))
                {
                    const THEME_TYPE: string = STEP.startsWith("    at ") 
                        ? THEME.STACKTRACE 
                        : THEME.ERROR;
                    console.log(THEME_TYPE, STEP);
                }
            }
        }

        // if error isn't of type Error, it's likely a string
        else
        {
            console.log(THEME.ERROR, error);
        }
    }
}

export default Logger;