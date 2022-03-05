import { PatternType, Rarity } from "../types";
import { InvalidSpreadsheet, Spreadsheet } from "./spreadsheet";

export enum Range
{
    Progressives = "Progressives!I2:AN70",
    AMCollectors = "A-M: Collectors!B2:K",
    NZCollectors = "N-Z: Collectors!B2:K",
}

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

export class UnknownKoiProgress extends KoiSpreadsheetError
{
    constructor(
        spreadsheetId: string, 
        type: PatternType, 
        koi: string, 
        pattern: string, 
        value: string )
    {
        super(
            spreadsheetId, 
            `has ${type.toLowerCase()} ${koi} ${pattern} marked with '${value}' ` +
            `instead of 'k', 'd', or no text`
        );
    }
}

export class KoiSpreadsheetMissingPattern extends KoiSpreadsheetError
{
    constructor(spreadsheetId: string, range: Range, row: number, column: number)
    {
        const CELL: Cell = getCell(range, row, column);
        super(
            spreadsheetId, 
            `missing pattern in sheet '${CELL.sheet}', row ${CELL.row}, `+
            `column ${CELL.column}`
        );
    }
}

export class KoiSpreadsheetMissingColor extends KoiSpreadsheetError
{
    constructor(
        spreadsheetId: string, 
        range: Range,
        row: number,
        column: number,
        pattern: string )
    {
        const CELL: Cell = getCell(range, row, column);
        super(
            spreadsheetId, 
            `missing color for ${getType(range).toLowerCase()} ${pattern} in ` +
            `row ${CELL.row}, column ${CELL.column}`
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
        return getPatternsFromSheet(spreadsheetId, Range.Progressives);
    },

    async getCollectorsAM(spreadsheetId: string)
    {
        return getPatternsFromSheet(spreadsheetId, Range.AMCollectors);
    },

    async getCollectorsNZ(spreadsheetId: string)
    {
        return getPatternsFromSheet(spreadsheetId, Range.NZCollectors);
    }

}

/**
 * 
 * @param spreadsheetId 
 * @param range 
 * @returns 
 */
async function getPatternsFromSheet(
    spreadsheetId: string, range: Range): Promise<Patterns>
{
    let patterns: Patterns = new Map();

    // determine the type of pattern
    const TYPE: PatternType = getType(range);

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
                        spreadsheetId, range, progressRow, patternColumn, PATTERN_NAME
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
                            spreadsheetId,
                            range, 
                            HIGHLIGHT_COLOR_ROW, 
                            progressColumn,
                            PATTERN_NAME
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
                            spreadsheetId, TYPE, KOI_NAME, PATTERN_NAME, PROGRESS_VALUE
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

interface Cell
{
    sheet: string;
    row: number;
    column: string;
}

function getCell(range: Range, row: number, column: number): Cell
{
    const SHEET: string = range.substring(0, range.indexOf("!"));

    // both progressives and collectors ranges start on row 2
    const REAL_ROW: number = row + 2;

    // sheets use letters, not numbers, for columns
    // also note that progressives start at column I,
    // and collectors start at column B
    const COLUMN_OFFSET: number = range == Range.Progressives ? 8 : 1;
    const REAL_COLUMN: string = 
        Spreadsheet.convertColumnIndexToLetter(column + COLUMN_OFFSET);

    return { 
        sheet: SHEET, 
        row: REAL_ROW, 
        column: REAL_COLUMN
    };
}

function getType(range: Range): PatternType
{
    return range == Range.Progressives ? PatternType.Progressive : PatternType.Collector;
}