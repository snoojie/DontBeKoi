import * as chalk from "chalk";

// theme
const stacktrace = chalk.hex("#8a6666");
const errorMessage = chalk.red;
const logMessage = chalk.green;

export class Logger
{
    public static log(message: string): void
    {
        console.log(logMessage(message));
    }

    public static error(message: string, error?: Error): void
    {
        console.log(errorMessage(message));
        if (error)
        {
            console.log(stacktrace(error.stack)); // greyish red
        }
    }
}