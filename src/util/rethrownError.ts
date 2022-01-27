export default class RethrownError extends Error
{
    constructor(message: string, error: any)
    {
        super(message);
        Object.setPrototypeOf(this, RethrownError.prototype);
        this.name = this.constructor.name;
        
        if (this.stack)
        {
            console.log("=================");
            console.log(this.stack);
            console.log("=================");
            
            // Sorcery is happening.
            // Previously, the following statement was true....
            //
            // by default, the stacktrace will look something like
            // RethrownError: Couldn't get spreadsheet
            //     at new RethrownError (...\dontbekoi\src\util\rethrownError.ts:5:9)
            //     at doStuff (...\dontbekoi\src\index.ts:17:26)
            //     at doStuff (...\dontbekoi\src\index.ts:19:6)
            //     ...continue stacktrace here...
            // we want to remove the "at new MyError" line because why is it even there!?
            //
            // ....but now, the stacktrace doesn't include the "at new RethrownError"
            // why? Maybe a change to tsconfig? 
            // No clue. Either way, commenting out the code that removes the first line
            // since apparently it isn't needed anymore.

            let steps: string[] = this.stack.split("\n");
            //steps.splice(1, 1);

            // keep only the first two lines so we have
            // RethrownError: Couldn't get spreadsheet
            //     at doStuff (...\dontbekoi\src\index.ts:17:26)
            // we don't care about the rest of the stack trace,
            // because that'll be included in the original error's stack
            this.stack = steps.slice(0,2).join("\n");

            // include the original error's stack trace as well
            this.stack += "\n" + error.stack;
        }
    }
}