import { KoiSpreadsheet, KoiSpreadsheetError } from "./koiSpreadsheet";
import { Spreadsheet } from "./spreadsheet";

export class PatternNotFoundInSpreadsheet extends KoiSpreadsheetError 
{
    constructor(spreadsheetId: string, pattern: string)
    {
        super(`Spreadsheet '${spreadsheetId}' missing pattern '${pattern}'.`);
    }
}

export class KoiNotFoundInSpreadsheet extends KoiSpreadsheetError 
{
    constructor(spreadsheetId: string, pattern: string, koi: string)
    {
        super(
            `Spreadsheet '${spreadsheetId}' missing koi '${koi}' ` +
            `for pattern '${pattern}'.`
        );
    }
}

export class UnknownKoiProgress extends KoiSpreadsheetError
{
    constructor(spreadsheetId: string, color: string, pattern: string, value: string)
    {
        super(
            `Spreadsheet '${spreadsheetId}' has koi '${color} ${pattern}' marked ` +
            `with '${value}'. Expected to see 'k', 'd', or no text.`
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
     * @throws InvalidGoogleApiKey if Google API key is invalid or missing.
     * @throws InvalidSpreadsheet if spreadsheet does not exist.
     * @throws PatternNotInSpreadsheet if the spreadsheet does not have the pattern.
     * @throws KoiNotInSpreadsheet if the spreadsheet has the pattern but not color.
     */
    hasKoi: async function(
        spreadsheetId: string, color: string, pattern: string): Promise<boolean>
    {
        // todo, check progressive

        // get the spreadsheet
        const RANGE: string = pattern.slice(0,1) < "n" 
            ? "A-M: Collectors!B2:K" 
            : "N-Z: Collectors!B2:K";
        const TABLE: string[][] = await Spreadsheet.getValues(spreadsheetId, RANGE);

        // find the pattern
        let patternRowIndex: number = -1;
        // note the pattern name appears every 7 rows
        for (let i=0; i<TABLE.length; i+=7)
        {
            const FOUND_PATTERN: string = 
                KoiSpreadsheet.getPattern(spreadsheetId, TABLE, i);
            if (equalsIgnoreCase(FOUND_PATTERN, pattern))
            {
                // found the pattern!
                patternRowIndex = i;
                break;
            }
        }
        if (patternRowIndex < 0)
        {
            throw new PatternNotFoundInSpreadsheet(spreadsheetId, pattern);
        }

        // find the base color
        let baseColorRowIndex: number = -1;
        let baseColor: string = "";
        // note the base colors appear 2-4 rows after the pattern name
        for(let i=patternRowIndex+2; i<patternRowIndex+6; i++)
        {
            baseColor = KoiSpreadsheet.getBaseColor(spreadsheetId, TABLE, i);
            if (startsWithIgnoreCase(color, baseColor))
            {
                // found the base color!
                baseColorRowIndex = i;
                break;
            }
        }
        if (baseColorRowIndex < 0)
        {
            throw new KoiNotFoundInSpreadsheet(spreadsheetId, pattern, color);
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
                spreadsheetId, TABLE, patternRowIndex + 1, i
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
            throw new KoiNotFoundInSpreadsheet(spreadsheetId, pattern, color);
        }

        // confirm the base and highlight color match the expected color
        if (!equalsIgnoreCase(baseColor+highlightColor, color))
        {
            throw new KoiNotFoundInSpreadsheet(spreadsheetId, pattern, color);
        }

        // Finally, we know the row and column of this koi.
        // Go read the value.
        // It should be empty if the user does not have the koi.
        // It should have "k" or "d" if the user has the koi.
        let VALUE: string = KoiSpreadsheet.getValue(
            TABLE, baseColorRowIndex, highlightColorColumnIndex
        );
        if (equalsIgnoreCase(VALUE, "k") || equalsIgnoreCase(VALUE, "d"))
        {
            return true;
        }
        if (VALUE.trim())
        {
            throw new UnknownKoiProgress(spreadsheetId, color, pattern, VALUE);
        }
        return false;
    } 

};

function equalsIgnoreCase(first: string, second: string): boolean
{
    return first.toLowerCase().trim() == second.toLowerCase().trim();
}

function startsWithIgnoreCase(first: string, second: string): boolean
{
    return first.toLowerCase().trim().startsWith(second.toLowerCase().trim());
}

function endsWithIgnoreCase(first: string, second: string): boolean
{
    return first.toLowerCase().trim().endsWith(second.toLowerCase().trim());
}