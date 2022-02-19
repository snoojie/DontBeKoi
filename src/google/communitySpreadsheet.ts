import { PatternType, Rarity } from "../types";
import { KoiSpreadsheet } from "./koiSpreadsheet";
import { Spreadsheet } from "./spreadsheet"

const SPREADSHEET_ID: string = "1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo";

export interface Pattern
{
    name: string;
    hatchTime?: number;
    kois: Koi[];
    type: PatternType;
}

export interface Koi
{
    name: string;
    rarity: Rarity;
}

/**
 * Represents Coris's google spreadsheet.
 */
export const CommunitySpreadsheet = {
    
    /**
     * Read Coris's google spreadsheet to get information about all patterns.
     * @returns Info on all patterns.
     */
    getAllPatterns: async function(): Promise<Pattern[]>
    {
        let patterns: Pattern[] = [];

        // get the hatch times of collectors
        let hatchTimes: Map<string, number> = new Map();
        const OVERVIEW: string[][] = 
            await Spreadsheet.getValues(SPREADSHEET_ID, "Overview!A3:I");
        for (let i=0; i<OVERVIEW.length; i++)
        {
            const PATTERN: string = KoiSpreadsheet.getValue(OVERVIEW, i, 0);
            // skip the blank row between m- and n- patterns
            if (PATTERN)
            {
                const HATCH_TIME: number = 
                    parseInt(KoiSpreadsheet.getValue(OVERVIEW, i, 8).substring(8));
                hatchTimes.set(PATTERN, HATCH_TIME);
            }
        }

        // get the pattern names and all their koi names
        await Promise.all([ 
            getPatternsFromSheet("Progressives!I2:AN70"),
            getPatternsFromSheet("A-M: Collectors!B2:K", hatchTimes), 
            getPatternsFromSheet("N-Z: Collectors!B2:K", hatchTimes)
        ]).then((patternsByType: Pattern[][]) => 
            patterns.push(...patternsByType.flat())
        );
        return patterns;
    }

}

async function getPatternsFromSheet(
    range: string, hatchTimes?: Map<string, number>): Promise<Pattern[]>
{
    let patterns: Pattern[] = [];

    // determine the type of pattern
    const TYPE: PatternType = range.startsWith("Progressive") 
        ? PatternType.Progressive 
        : PatternType.Collector

    // get the the spreadsheet
    const TABLE: string[][] = 
        await Spreadsheet.getValues(SPREADSHEET_ID, range);

    // find each pattern
    // note there is a pattern every 7 rows
    for (let patternRow=0; patternRow<TABLE.length; patternRow+=7)
    {

        // note that on the progressives sheet, 
        // there are three sets of patterns per row, every 11 columns
        const PATTERNS_PER_ROW = TYPE==PatternType.Progressive ? 3 : 1;
        for (let patternColumn=0; patternColumn<PATTERNS_PER_ROW*11; patternColumn+=11)
        {

            let pattern: Pattern = {
                name: KoiSpreadsheet.getPattern(TABLE, patternRow, patternColumn),
                type: TYPE,
                kois: []
            };

            // find all base colors
            let baseColors: string[] = [];
            for (let colorRow=patternRow+2; colorRow<patternRow+6; colorRow++)
            {
                baseColors.push(
                    KoiSpreadsheet.getBaseColor(TABLE, colorRow, patternColumn)
                );
            }

            // find all highlight colors
            let commonHighlightColors: string[] = 
                getHighlightColors(TABLE, patternRow, patternColumn+1);
            let rareHighlightColors: string[] = 
                getHighlightColors(TABLE, patternRow, patternColumn+6);

            // we know all the colors, so we can set the kois for this pattern
            for (const BASE_COLOR of baseColors)
            {
                pattern.kois.push(
                    ...getKoiCollection(BASE_COLOR, commonHighlightColors, Rarity.Common)
                );
                pattern.kois.push(
                    ...getKoiCollection(BASE_COLOR, rareHighlightColors, Rarity.Rare)
                );
            }

            // see if we know the hatch time for this pattern
            if (hatchTimes && hatchTimes.has(pattern.name))
            {
                pattern.hatchTime = hatchTimes.get(pattern.name);
            }

            // add this pattern to our list of patterns
            patterns.push(pattern);
        }
    }

    return patterns;
}


function getHighlightColors(
    table: string[][], patternRowIndex: number, startingColumnIndex: number
): string[]
{
    let highlightColors: string[] = [];
    for (let j=startingColumnIndex; j<startingColumnIndex+4; j++)
    {
        highlightColors.push(
            KoiSpreadsheet.getHighlightColor(table, patternRowIndex+1, j)
        );
    }
    return highlightColors;
}

function getKoiCollection(
    baseColor: string, highlightColors: string[], rarity: Rarity): Koi[]
{
    let kois: Koi[] = [];
    for (const HIGHLIGHT_COLOR of highlightColors)
    {
        kois.push({
            name: baseColor + HIGHLIGHT_COLOR,
            rarity: rarity
        });
    }
    return kois;
}