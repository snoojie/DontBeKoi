import type { Command } from "../command";
import { DataAccessLayer } from "../dataAccessLayer";

const UpdateCommand: Command = {

    name: "update",

    description: "Let this bot know that there's a new pattern.",
    
    execute: async function (): Promise<string> 
    {
        const NEW_PATTERNS: string[] = await DataAccessLayer.updatePatterns();

        // Reply with the new patterns that were added.
        
        // example reply:
        // Added new patterns Hanrin, Naisu, and Sutaggu.
        if (NEW_PATTERNS.length > 2)
        {
            return `Added new patterns ${NEW_PATTERNS.slice(0, -1).join(", ")}, and ${NEW_PATTERNS.slice(-1)[0]}.`;
        }

        // example reply:
        // Added new patterns Hanrin and Naisu.
        if (NEW_PATTERNS.length == 2)
        {
            return `Added new patterns ${NEW_PATTERNS.join(" and ")}.`;
        }

        // example reply:
        // Added new pattern Hanrin.
        if (NEW_PATTERNS.length == 1)
        {
            return `Added new pattern ${NEW_PATTERNS[0]}.`;
        }

        return "There are no new patterns.";
    }

};

export default UpdateCommand;