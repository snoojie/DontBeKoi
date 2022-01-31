import { PatternType, Rarity } from "../types";
import Google from "./spreadsheet"

const SPREADSHEET_ID: string = "1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo";

export type OverviewEntry = {
    name: string;
    hatchTime?: number;
    type: PatternType;
};
export type Overview = OverviewEntry[];

export type SpreadsheetKoi = {
    name: string;
    rarity: Rarity;
    pattern: string;
}

type PatternColors = {
    base: string[];
    common: string[];
    rare: string[];
}

export const CommunitySpreadsheet = {
    
    getOverview: async function(): Promise<Overview>
    {
        let overviewPromises: Promise<Overview>[] = [
            getOverview(PatternType.Collector),
            getOverview(PatternType.Progressive)
        ];
        const OVERVIEW: Overview = (await Promise.all(overviewPromises)).flat();
        return OVERVIEW;
    },

    getKois: async function(): Promise<SpreadsheetKoi[]>
    {
        // for the progressive and collector sheets,
        // every seven rows there's a pattern that looks like:
        // Inazuma |        |       |      |       | |        |       |       |
        //         | -shiro | -ukon | -dai | -kuro | | -pinku | -mura | -mido | -buru
        // Shi-    |        |       |      |       | |        |       |       |
        // Ki-     |        |       |      |       | |        |       |       |
        // Aka-    |        |       |      |       | |        |       |       |
        // Ku -    |        |       |      |       | |        |       |       |

        let getKoisPromises: Promise<SpreadsheetKoi[]>[] = [
            getProgressives(), getCollectors()
        ];
        const KOIS: SpreadsheetKoi[] = (await Promise.all(getKoisPromises)).flat();
        return KOIS;
    }

}

async function getProgressives(): Promise<SpreadsheetKoi[]>
{
    // get the values from the spreadsheet
    const TABLE: string[][] = 
        await Google.getValues(SPREADSHEET_ID, "Progressives!I2:AN70");

    // get the list of progressive patterns
    let patterns: string[] = [];
    for (let i=0; i<=TABLE.length; i+=7)
    {
        for (let j=0; j<3; j++)
        {
            const COLUMN_INDEX: number = 11 * j;
            const PATTERN: string = TABLE[i]![COLUMN_INDEX] || "";
            if (!PATTERN)
            {
                throw new Error(
                    `Missing name for progressive pattern in (row, column) ` +
                    `(${i}, ${COLUMN_INDEX}).`
                );
            }
            patterns.push(PATTERN);
        }
    }

    // get the colors
    const COLORS = getColors(TABLE, 0);

    // we have all the info about progressives!
    let progressives: SpreadsheetKoi[] = [];
    for (const PATTERN of patterns)
    {
        progressives = progressives.concat(getKoisOfPattern(COLORS, PATTERN));
    }

    return progressives;
}

async function getCollectors(): Promise<SpreadsheetKoi[]>
{
    let collectorsPromises: Promise<SpreadsheetKoi[]>[] = [
        getCollectorsHalf("A-M: Collectors!B2:K"),
        getCollectorsHalf("N-Z: Collectors!B2:K")
    ];
    const COLLECTORS: SpreadsheetKoi[] = (await Promise.all(collectorsPromises)).flat();
    return COLLECTORS;
}

async function getCollectorsHalf(range: string): Promise<SpreadsheetKoi[]>
{
    // get the values from the spreadsheet
    const TABLE: string[][] = await Google.getValues(SPREADSHEET_ID, range);

    let collectors: SpreadsheetKoi[] = [];

    for (let i=0; i<TABLE.length; i+=7)
    {
        // get the pattern name
        const PATTERN: string = TABLE[i]![0] || "";
        if (!PATTERN)
        {
            // must have reached near the end of the sheet
            break;
        }

        // get the colors
        const COLORS: PatternColors = getColors(TABLE, i);

        // we have the colors and pattern name
        // get the list of kois of this pattern
        collectors = collectors.concat(getKoisOfPattern(COLORS, PATTERN));
    }

    return collectors;
}

function getKoisOfPattern(colors: PatternColors, pattern: string): SpreadsheetKoi[]
{
    let kois: SpreadsheetKoi[] = [];
    for (const BASE_COLOR of colors.base)
    {
        kois = kois.concat(
            getKoisOfRarity(BASE_COLOR, colors.common, Rarity.Common, pattern),
            getKoisOfRarity(BASE_COLOR, colors.rare,   Rarity.Rare,   pattern)
        );
    }
    return kois;
}

function getKoisOfRarity(baseColor: string, highlightColors: string[], rarity: Rarity, pattern: string): SpreadsheetKoi[]
{
    let kois: SpreadsheetKoi[] = [];
    for (const HIGHLIGHT_COLOR of highlightColors)
    {
        kois.push({
            name: baseColor + HIGHLIGHT_COLOR,
            rarity: rarity,
            pattern: pattern
        });
    }
    return kois;
}

function getColors(table: string[][], patternNameRowIndex: number): PatternColors
{
    return {
        base: getBaseColors(table, patternNameRowIndex),
        common: getHighlightColors(table, patternNameRowIndex, Rarity.Common),
        rare: getHighlightColors(table, patternNameRowIndex, Rarity.Rare)
    };
}

function getBaseColors(table: string[][], patternNameRowIndex: number): string[]
{
    let baseColors: string[] = [];
    for (let i=2; i<6; i++)
    {
        const ROW_INDEX: number = patternNameRowIndex + i;
        let baseColor: string = table[ROW_INDEX]![0] || "";
        if (!baseColor)
        {
            throw new Error(`Can't get base colors at row ${ROW_INDEX}.`);
        }

        // strip the dash if there is one
        if (baseColor.endsWith("-"))
        {
            baseColor = baseColor.slice(0, -1);
        }

        baseColors.push(baseColor);
    }
    return baseColors;
}

function getHighlightColors(table: string[][], patternNameRowIndex: number, rarity: Rarity): string[]
{
    const HIGHLIGHT_ROW: string[] = table[patternNameRowIndex + 1]!;

    // common highlight colors are in columns 1-4
    // rare highlight colors are in columns 6-9
    const OFFSET: number = rarity == Rarity.Common ? 1 : 6;

    let highlightColors: string[] = [];
    for (let i=0; i<4; i++)
    {
        let highlightColor: string = HIGHLIGHT_ROW[i + OFFSET] || "";
        if (!highlightColor)
        {
            throw new Error(`Can't get ${rarity} progressive highlight colors.`);
        }

        // strip the dash if there is one
        if (highlightColor.startsWith("-"))
        {
            highlightColor = highlightColor.substring(1);
        }

        highlightColors.push(highlightColor);
    }
    
    return highlightColors;
}

async function getOverview(type: PatternType): Promise<Overview>
{
    // determine the range used based on whether this is collectors or progressives
    const RANGE: string = 
        type == PatternType.Collector ? "Overview!A4:I" : "Progressives!A2:A31";

    // get the values from the spreadsheet
    const TABLE: string[][] = await Google.getValues(SPREADSHEET_ID, RANGE);
    
    // get the overview
    let overview: Overview = [];
    for (const ROW of TABLE)
    {
        // skip empty row
        // this happens on the overview sheet, there's an empty row between m and n
        if (!ROW[0])
        {
            continue;
        }

        let overviewEntry: OverviewEntry = { 
            name: ROW[0],
            type: type
        };

        // get the hatch time for collectors
        if (type == PatternType.Collector)
        {
            const COVID_VALUE: string = ROW[8] || "";
            if (!COVID_VALUE)
            {
                throw new Error(
                    `Expected a value in the last overview column, ` +
                    `but there wasn't one: ${ROW}`
                );
            }
            overviewEntry.hatchTime = parseInt(COVID_VALUE.substring(8));
        }

        overview.push(overviewEntry);
    }

    return overview;
}