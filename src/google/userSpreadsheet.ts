import { PatternType } from "../types";

export const UserSpreadsheet = {

    hasKoi: async function(
        spreadsheetId: string, color: string, pattern: string, type: PatternType
    ): Promise<boolean>
    {
        if (!spreadsheetId && !color && !pattern && !type) { return false; }
        return true;
    } 

};