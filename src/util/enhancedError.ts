export default class EnhancedError extends Error
{
    constructor(message: string, error?: any)
    {
        super(message);
        this.name = this.constructor.name;
        
        if (error)
        {
            // if the original error is of type error...
            if (error.stack && this.stack)
            {
                // the stacktrace will be duplicated in error and this new error
                // so, for this new error, only keep the first two lines
                // ex: 
                // EnhancedError: Couldn't get spreadsheet
                //     at doStuff (...\dontbekoi\src\index.ts:17:26)

                let steps: string[] = this.stack.split("\n");
                this.stack = steps.slice(0,2).join("\n");

                // include the original error's stack trace as well
                this.stack += "\n" + error.stack;
            }

            // else, it's likely just a string...
            else
            {
                this.stack += "\n" + error;
            }
        }
    }
}