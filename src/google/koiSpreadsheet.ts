import { PatternType, Rarity } from "../types";
import { InvalidSpreadsheet, Spreadsheet } from "./spreadsheet";

export enum Progress 
{
    NOT_YET_COLLECTED,
    KOI_IN_COLLECTION,
    DRAGON_IN_COLLECTION
}

export interface Koi 
{ 
    rarity: Rarity, 
    progress: Progress 
}

export type Kois = Map<string, Koi>;

export interface Pattern 
{ 
    type: PatternType, 
    kois: Kois, 
    hatchTime?: number 
}

export type Patterns = Map<string, Pattern>;

export abstract class KoiSpreadsheetError extends InvalidSpreadsheet {}

export abstract class KoiSpreadsheetMissingData extends KoiSpreadsheetError
{
    constructor(
        description: string, 
        spreadsheetId: string, 
        range: string, 
        row: number, 
        column: number)
    {

        // both progressives and collectors ranges start on row 2
        const REAL_ROW: number = row + 2;

        // sheets use letters, not numbers, for columns
        // also note that progressives start at column I,
        // and collectors start at column B
        const COLUMN_OFFSET: number = range.startsWith("Progressive") ? 8 : 1;
        const REAL_COLUMN: string = 
            Spreadsheet.convertColumnIndexToLetter(column + COLUMN_OFFSET);

        super(
            `Error with spreadsheet '${spreadsheetId}', ` +
            `sheet '${range.substring(0, range.indexOf("!"))}'. ` +
            `Expected to find ${description} at row ${REAL_ROW}, ` +
            `column ${REAL_COLUMN}, but that cell is empty.`
        );
    }
}

export class KoiSpreadsheetMissingPattern extends KoiSpreadsheetMissingData
{
    constructor(spreadsheetId: string, range: string, row: number, column: number)
    {
        super("a pattern name", spreadsheetId, range, row, column);
    }
}

export class KoiSpreadsheetMissingColor extends KoiSpreadsheetMissingData
{
    constructor(
        pattern: string, 
        spreadsheetId: string, 
        range: string,
        row: number,
        column: number )
    {
        super(`a color name for pattern '${pattern}'`, spreadsheetId, range, row, column);
    }
}

export class UnknownKoiProgress extends KoiSpreadsheetError
{
    constructor(spreadsheetId: string, koi: string, pattern: string, value: string)
    {
        super(
            `Spreadsheet '${spreadsheetId}' has koi '${koi} ${pattern}' marked ` +
            `with '${value}'. Expected 'k', 'd', or no text.`
        );
    }
}

export const KoiSpreadsheet = {

    
    /**
     * Gets the string in the table at (row, column).
     * Accent characters are replaced by their non accent characters.
     * If there is no text in that cell, or the row or column index is out of bounds, 
     * an empty string "" is returned.
     * @param table array of arrays representing the google spreadsheet values.
     * @param rowIndex index of the row to get the string from.
     * @param columnIndex index of the column to get the string from.
     * @returns string at (row, column).
     */
    getValue(table: string[][], rowIndex: number, columnIndex: number): string
    {
        const ROW: string[] = table[rowIndex] || [];
        let value: string = ROW[columnIndex] || "";
        value = value.normalize("NFD").replace(/\p{Diacritic}/gu, "");
        return value;
    },

    /**
     * Returns all progressive patterns and their kois, 
     * and the user's progress of those kois.
     * @param spreadsheetId Spreadsheet to get the progressives from.
     * @returns progressives
     * @throws UnknownKoiProgress 
     * @throws ColorNotFound
     * @throws InvalidGoogleApiKey
     * @throws SpreadsheetNotFound
     * @throws PrivateSpreadsheet
     * @throws RangeNotFound
     */
    async getProgressives(spreadsheetId: string)
    {
        return getPatternsFromSheet(spreadsheetId, "Progressives!I2:AN70");
    },

    async getCollectorsAM(spreadsheetId: string)
    {
        return getPatternsFromSheet(spreadsheetId, "A-M: Collectors!B2:K");
    },

    async getCollectorsNZ(spreadsheetId: string)
    {
        return getPatternsFromSheet(spreadsheetId, "N-Z: Collectors!B2:K");
    }

}

/**
 * 
 * @param spreadsheetId 
 * @param range 
 * @returns 
 */
async function getPatternsFromSheet(
    spreadsheetId: string, range: string): Promise<Patterns>
{
    let patterns: Patterns = new Map();

    // determine the type of pattern
    const TYPE: PatternType = range.startsWith("Progressive") 
        ? PatternType.Progressive 
        : PatternType.Collector

    // get the sheet
    const TABLE: string[][] = await Spreadsheet.getValues(spreadsheetId, range);

    // find each pattern
    // note there is a pattern every 7 rows
    for (let patternRow=0; patternRow<TABLE.length; patternRow+=7)
    {

        // note that on the progressives sheet, 
        // there are three sets of patterns per row, every 11 columns
        const PATTERNS_PER_ROW: number = TYPE==PatternType.Progressive ? 3 : 1;
        for (let patternColumn=0; patternColumn<PATTERNS_PER_ROW*11; patternColumn+=11)
        {

            const PATTERN_NAME: string = 
                KoiSpreadsheet.getValue(TABLE, patternRow, patternColumn);
            if (!PATTERN_NAME)
            {
                throw new KoiSpreadsheetMissingPattern(
                    spreadsheetId, range, patternRow, patternColumn
                );
            }

            let pattern: Pattern = {
                type: TYPE,
                kois: new Map()
            };

            // we can get all the kois by looking at each koi progress cell
            // so, to start, loop over every progress row
            for (let progressRow=patternRow+2; progressRow<patternRow+6; progressRow++)
            {

                // get the base color
                // strip the suffix dash if there is one,
                // ex: 'Shi-' -> 'Shi'
                let baseColor: string = 
                    KoiSpreadsheet.getValue(TABLE, progressRow, patternColumn);
                if (!baseColor)
                {
                    throw new KoiSpreadsheetMissingColor(
                        PATTERN_NAME, spreadsheetId, range, progressRow, patternColumn
                    );
                }
                if (baseColor.endsWith("-"))
                {
                    baseColor = baseColor.slice(0, -1);
                }

                let rarity: Rarity = Rarity.Common;

                // we are looking at a specific progress row
                // so loop over each progress column
                for (let progressColumn = patternColumn + 1; 
                     progressColumn < patternColumn + 10; 
                     progressColumn++ )
                {

                    // there is an empty column between commons and rares
                    if((progressColumn-5)%11 == 0)
                    {
                        rarity = Rarity.Rare;
                        continue;
                    }

                    // get the highlight color
                    // strip the prefix dash if there is one,
                    // ex: '-shiro' -> 'shiro'
                    const HIGHLIGHT_COLOR_ROW: number = patternRow+1;
                    let highlightColor: string = KoiSpreadsheet.getValue(
                        TABLE, HIGHLIGHT_COLOR_ROW, progressColumn
                    );
                    if (!highlightColor)
                    {
                        throw new KoiSpreadsheetMissingColor(
                            PATTERN_NAME, 
                            spreadsheetId,
                            range, 
                            HIGHLIGHT_COLOR_ROW, 
                            progressColumn
                        );
                    }
                    if (highlightColor.startsWith("-"))
                    {
                        highlightColor = highlightColor.substring(1);
                    }
                    
                    const KOI_NAME: string = baseColor + highlightColor;

                    const PROGRESS_VALUE: string = 
                        KoiSpreadsheet.getValue(TABLE, progressRow, progressColumn);
                    
                    let progress: Progress | undefined;
                    switch(PROGRESS_VALUE.toLowerCase().trim())
                    {
                        case "k":
                            progress = Progress.KOI_IN_COLLECTION;
                            break;
                        case "d": 
                            progress = Progress.DRAGON_IN_COLLECTION;
                            break;
                        case "":
                            progress = Progress.NOT_YET_COLLECTED;
                            break;
                    }
                    if (progress == undefined)
                    {
                        throw new UnknownKoiProgress(
                            spreadsheetId, KOI_NAME, PATTERN_NAME, PROGRESS_VALUE
                        );
                    }

                    pattern.kois.set(KOI_NAME, { rarity, progress: progress! });
                }
            }

            patterns.set(PATTERN_NAME, pattern);
        }
    }

    return patterns;
}