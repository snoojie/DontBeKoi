// references: 
// https://stackoverflow.com/a/41407246
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

export class Logger
{
    /**
     * Replacement to console.log
     * @param message message to print
     */
    public static log(message: string): void
    {
        console.log(Theme.LOG, message);
    }

    /**
     * Replacement to console.error
     * @param message Quick message to describe the error
     * @param error Error itself
     */
    public static error(message: string, error: any): void
    {
        console.log(Theme.ERROR, message);
        for (let step of error.stack.split("\n"))
        {
            console.log(Theme.STACKTRACE, step);
        }
    }
}