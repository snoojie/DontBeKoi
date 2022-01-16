import * as chalk from "chalk";

// theme
const stacktrace = chalk.hex("#8a6666");
const errorMessage = chalk.red;
const logMessage = chalk.green;

export class Logger
{
    /**
     * Replacement to console.log
     * @param message message to print
     */
    public static log(message: string): void
    {
        console.log(logMessage(message));
    }

    /**
     * Replacement to console.error
     * @param message Quick message to describe the error
     * @param error Error itself
     */
    public static error(message: string, error: Error): void
    {
        console.log(errorMessage(message));
        console.log(stacktrace(error.stack)); // greyish red
    }
}