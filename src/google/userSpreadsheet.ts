import { PatternType } from "../types";
import KoiSpreadsheet from "./koiSpreadsheet";
import Spreadsheet from "./spreadsheet";

export const UserSpreadsheet = {

    hasKoi: async function(
        spreadsheetId: string, color: string, pattern: string, type: PatternType
    ): Promise<boolean>
    {
        if (!type) { return false; }

        // lowercase pattern and color
        const PATTERN_LOWERCASE: string = pattern.toLowerCase();
        const COLOR_LOWERCASE: string = color.toLowerCase();

        // get the spreadsheet
        const RANGE: string = PATTERN_LOWERCASE.slice(0,1) < "n" 
            ? "A-M: Collectors!B2:K" 
            : "N-Z: Collectors!B2:K";
        const TABLE: string[][] = await Spreadsheet.getValues(spreadsheetId, RANGE);

        // find the pattern in the table
        let patternNameRowIndex: number = -1;
        for (let i=0; i<TABLE.length; i+=7)
        {
            const FOUND_PATTERN_NAME: string = 
                KoiSpreadsheet.getPatternNameFromRow(TABLE, i);
            if (FOUND_PATTERN_NAME.toLowerCase() == PATTERN_LOWERCASE)
            {
                // found the pattern!
                patternNameRowIndex = i;
                break;
            }
        }
        if (patternNameRowIndex < 0)
        {
            throw new Error(
                `Spreadsheet ${spreadsheetId} does not have pattern ${pattern}.`
            );
        }

        // find the base color
        let baseColorRowIndex: number = -1;
        for(let i=0; i<4; i++)
        {
            const ROW_INDEX: number = patternNameRowIndex + i + 2;
            const BASE_COLOR: string = 
                KoiSpreadsheet.getBaseColorFromRow(TABLE, ROW_INDEX);
            if (COLOR_LOWERCASE.startsWith(BASE_COLOR.toLowerCase()))
            {
                // found the base color!
                baseColorRowIndex = ROW_INDEX;
                break;
            }
        }
        if (baseColorRowIndex < 0)
        {
            throw new Error(
                `Spreadsheet ${spreadsheetId} has pattern ${pattern} but it does ` +
                `not have color ${color}.`
            );
        }

        // find the highlight color
        let highlightColorColumnIndex: number = -1;
        for (let i=0; i<4; i++)
        {
            const COLUMN_INDEX: number = i + 1;
            const HIGHLIGHT_COLOR: string = 
                KoiSpreadsheet.getHighlightColorFromColumn(
                    TABLE, patternNameRowIndex + 1, COLUMN_INDEX
                );
            if (COLOR_LOWERCASE.endsWith(HIGHLIGHT_COLOR.toLowerCase()))
            {
                // found the highlight color!
                highlightColorColumnIndex = COLUMN_INDEX;
                break;
            }
        }
        if (highlightColorColumnIndex < 0)
        {
            throw new Error(
                `Spreadsheet ${spreadsheetId} has pattern ${pattern} but it does ` +
                `not have color ${color}.`
            );
        }

        // read the value of this pattern's color
        // if it is empty, the user does not have this koi
        // if it has "k" or "d", the user has this koi
        const VALUE: string = KoiSpreadsheet.getStringFromCell(
            TABLE, baseColorRowIndex, highlightColorColumnIndex
        ).toLowerCase();
        return VALUE == "k" || VALUE == "d";
    } 

};