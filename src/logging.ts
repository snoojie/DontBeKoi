import * as chalk from "chalk";

export class Logger
{
    public static log(message: string): void
    {
        console.log(chalk.green(message));
    }

    public static error(message: string, error: Error): void
    {
        console.log(chalk.red(message));
        console.log(chalk.hex("#8a6666")(error.stack)); // greyish red
    }
}