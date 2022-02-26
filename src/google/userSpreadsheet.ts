import { Spreadsheet } from "./spreadsheet";
import { KoiSpreadsheet, KoiSpreadsheetError } from "./koiSpreadsheet";
import { PatternType } from "../types";

export class PatternNotInSpreadsheet extends KoiSpreadsheetError 
{
    constructor(spreadsheetId: string, pattern: string)
    {
        super(`Spreadsheet '${spreadsheetId}' missing pattern '${pattern}'.`);
    }
}

export class KoiNotInSpreadsheet extends KoiSpreadsheetError 
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
     * @throws ConfigError if Google Api key is not set in environment variables.
     * @throws InvalidGoogleApiKey if Google API key is invalid
     * @throws SpreadsheetNotFound if spreadsheet does not exist.
     * @throws PrivateSpreadsheet if the spreadsheet is private.
     * @throws PatternNotInSpreadsheet if the spreadsheet does not have the pattern.
     * @throws KoiNotInSpreadsheet if the spreadsheet has the pattern but not color.
     * @throws UnknownKoiProgress if the koi is not marked with k or d, or left empty.
     * @throws RangeNotFound if the range does not exist for the spreadsheet.
     */
    hasKoi: async function(
        spreadsheetId: string, color: string, pattern: string, type: PatternType
    ): Promise<boolean>
    {
        // todo, check progressive

        // get the spreadsheet
        const RANGE: string = type == PatternType.Collector
            ? pattern.slice(0,1) < "n" 
                ? "A-M: Collectors!B2:K" 
                : "N-Z: Collectors!B2:K"
            : "Progressives!I2:AN70";
        const TABLE: string[][] = await Spreadsheet.getValues(spreadsheetId, RANGE);

        // find the pattern
        let patternRowIndex: number = -1;
        let patternColumnIndex: number = -1;
        // note the pattern name appears every 7 rows
        for (let i=0; i<TABLE.length; i+=7)
        {

            // note that progressives have a pattern name every 11 columns
            const PATTERNS_PER_ROW: number = type==PatternType.Progressive ? 3 : 1;
            for (let j=0; j<PATTERNS_PER_ROW*11; j+=11)
            {
                const FOUND_PATTERN: string = 
                    KoiSpreadsheet.getPattern(spreadsheetId, TABLE, i, j);
                if (equalsIgnoreCase(FOUND_PATTERN, pattern))
                {
                    // found the pattern!
                    patternRowIndex = i;
                    patternColumnIndex = j;
                    break;
                }
            }
        }
        if (patternRowIndex < 0)
        {
            throw new PatternNotInSpreadsheet(spreadsheetId, pattern);
        }

        // find the base color
        let baseColorRowIndex: number = -1;
        let baseColor: string = "";
        // note the base colors appear 2-4 rows after the pattern name
        for(let i=patternRowIndex+2; i<patternRowIndex+6; i++)
        {
            baseColor = 
                KoiSpreadsheet.getBaseColor(spreadsheetId, TABLE, i, patternColumnIndex);
            if (startsWithIgnoreCase(color, baseColor))
            {
                // found the base color!
                baseColorRowIndex = i;
                break;
            }
        }
        if (baseColorRowIndex < 0)
        {
            throw new KoiNotInSpreadsheet(spreadsheetId, pattern, color);
        }

        // find the highlight color
        let highlightColorColumnIndex: number = -1;
        let highlightColor: string = "";
        for (let i=patternColumnIndex+1; i<patternColumnIndex+10; i++)
        {

            // common highlight columns are in columns 1-4
            // rare highlight columns are in columns 6-9
            // column 5 is empty, so ignore it
            if (i==patternColumnIndex+5)
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
            throw new KoiNotInSpreadsheet(spreadsheetId, pattern, color);
        }

        // confirm the base and highlight color match the expected color
        if (!equalsIgnoreCase(baseColor+highlightColor, color))
        {
            throw new KoiNotInSpreadsheet(spreadsheetId, pattern, color);
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