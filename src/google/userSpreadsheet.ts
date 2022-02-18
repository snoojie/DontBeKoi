import EnhancedError from "../util/enhancedError";
import { KoiSpreadsheet } from "./koiSpreadsheet";
import { Spreadsheet } from "./spreadsheet";

/**
 * Error thrown when a pattern could not be found in the user spreadsheet.
 */
export class UserSpreadsheetMissingPattern extends EnhancedError 
{
    constructor(spreadsheetId: string, pattern: string)
    {
        super(`Spreadsheet '${spreadsheetId}' missing pattern '${pattern}'.`);
    }
}

/**
 * Error thrown when a pattern was found in the user spreadsheet, but not the color.
 */
export class UserSpreadsheetMissingColor extends EnhancedError 
{
    constructor(spreadsheetId: string, pattern: string, color: string)
    {
        super(
            `Spreadsheet '${spreadsheetId}' missing color '${color}' ` +
            `for pattern '${pattern}'.`
        );
    }
}

/**
 * A user's google spreadsheet with their koi collection.
 */
export const UserSpreadsheet = {

    /**
     * Checks if this user has a specific koi or not.
     * @param spreadsheetId ID of the user's spreadsheet.
     * @param color Koi's color.
     * @param pattern Koi's pattern.
     * @returns true or false.
     * @throws ConfigError if missing Google API key env variables.
     * @throws SpreadsheetError if spreadsheet ID or Google API key is not valid.
     * @throws UserSpreadsheetMissingPattern if the spreadsheet does not have
     *         the pattern.
     * @throws UserSpreadsheetMissingColor if the spreadsheet has the pattern 
     *         but not color.
     */
    hasKoi: async function(
        spreadsheetId: string, color: string, pattern: string): Promise<boolean>
    {
        // todo, check progressive

        // get the spreadsheet
        // throws ConfigError if Google API key not an env variable
        // throws SpreadsheetError if Google API key, spreadsheet ID, 
        // or range not valid
        const RANGE: string = pattern.slice(0,1) < "n" 
            ? "A-M: Collectors!B2:K" 
            : "N-Z: Collectors!B2:K";
        const TABLE: string[][] = await Spreadsheet.getValues(spreadsheetId, RANGE);

        // find the pattern
        let patternRowIndex: number = -1;
        // note the pattern name appears every 7 rows
        for (let i=0; i<TABLE.length; i+=7)
        {
            const FOUND_PATTERN: string = KoiSpreadsheet.getPattern(TABLE, i);
            if (equalsIgnoreCase(FOUND_PATTERN, pattern))
            {
                // found the pattern!
                patternRowIndex = i;
                break;
            }
        }
        if (patternRowIndex < 0)
        {
            throw new UserSpreadsheetMissingPattern(spreadsheetId, pattern);
        }

        // find the base color
        let baseColorRowIndex: number = -1;
        let baseColor: string = "";
        // note the base colors appear 2-4 rows after the pattern name
        for(let i=patternRowIndex+2; i<patternRowIndex+6; i++)
        {
            baseColor = KoiSpreadsheet.getBaseColor(TABLE, i);
            if (startsWithIgnoreCase(color, baseColor))
            {
                // found the base color!
                baseColorRowIndex = i;
                break;
            }
        }
        if (baseColorRowIndex < 0)
        {
            throw new UserSpreadsheetMissingColor(spreadsheetId, pattern, color);
        }

        // find the highlight color
        let highlightColorColumnIndex: number = -1;
        let highlightColor: string = "";
        for (let i=1; i<10; i++)
        {

            // common highlight columns are in columns 1-4
            // rare highlight columns are in columns 6-9
            // column 5 is empty, so ignore it
            if (i==5)
            {
                continue;
            }

            highlightColor = KoiSpreadsheet.getHighlightColor(
                TABLE, patternRowIndex + 1, i
            );
            if (endsWithIgnoreCase(color, highlightColor))
            {
                // found the highlight color!
                highlightColorColumnIndex = i;
                break;
            }
        }
        if (highlightColorColumnIndex < 0)
        {
            throw new UserSpreadsheetMissingColor(spreadsheetId, pattern, color);
        }

        // confirm the base and highlight color match the expected color
        if (!equalsIgnoreCase(baseColor+highlightColor, color))
        {
            throw new UserSpreadsheetMissingColor(spreadsheetId, pattern, color);
        }

        // Finally, we know the row and column of this koi.
        // Go read the value.
        // It should be empty if the user does not have the koi.
        // It should have "k" or "d" if the user has the koi.
        const VALUE: string = KoiSpreadsheet.normalizeCell(
            TABLE, baseColorRowIndex, highlightColorColumnIndex
        );
        return equalsIgnoreCase(VALUE, "k") || equalsIgnoreCase(VALUE, "d");
    } 

};

function equalsIgnoreCase(first: string, second: string): boolean
{
    return first.toLowerCase() == second.toLowerCase();
}

function startsWithIgnoreCase(first: string, second: string): boolean
{
    return first.toLowerCase().startsWith(second.toLowerCase());
}

function endsWithIgnoreCase(first: string, second: string): boolean
{
    return first.toLowerCase().endsWith(second.toLowerCase());
}