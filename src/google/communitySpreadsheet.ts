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

export type Koi = {
    name: string;
    rarity: Rarity;
}

export type Pattern = {
    name: string;
    kois: Koi[];
}

export const CommunitySpreadsheet = {
    
    getOverview: async function(): Promise<Overview>
    {
        const OVERVIEW_PROMISES: Promise<Overview>[] = [
            getOverview(PatternType.Collector),
            getOverview(PatternType.Progressive)
        ];
        const OVERVIEW: Overview = (await Promise.all(OVERVIEW_PROMISES)).flat();
        return OVERVIEW;
    },

    getProgressives: async function(): Promise<SpreadsheetKoi[]>
    {
        // get the values from the spreadsheet
        const TABLE: string[][] = 
            await Google.getValues(SPREADSHEET_ID, "Progressives!I2:AN70");

        // every seven rows there's a pattern that looks like:
        // Inazuma |        |       |      |       | |        |       |       |
        //         | -shiro | -ukon | -dai | -kuro | | -pinku | -mura | -mido | -buru
        // Shi-    |        |       |      |       | |        |       |       |
        // Ki-     |        |       |      |       | |        |       |       |
        // Aka-    |        |       |      |       | |        |       |       |
        // Ku -    |        |       |      |       | |        |       |       |

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

        // get the base colors
        let baseColors: string[] = [];
        for (let i=2; i<6; i++)
        {
            let baseColor: string = TABLE[i]![0] || "";
            if (!baseColor)
            {
                throw new Error("Can't get progressive base colors.");
            }

            // strip the dash if there is one
            if (baseColor.endsWith("-"))
            {
                baseColor = baseColor.slice(0, -1);
            }

            baseColors.push(baseColor);
        }

        // get the highlight colors
        const HIGHLIGHT_ROW: string[] = TABLE[1]!;
        const COMMON_HIGHLIGHT_COLORS: string[] = 
            getHighlightColors(HIGHLIGHT_ROW, Rarity.Common);
        const RARE_HIGHLIGHT_COLORS: string[] = 
            getHighlightColors(HIGHLIGHT_ROW, Rarity.Rare);

        // we have all the info about progressives!
        let progressives: SpreadsheetKoi[] = [];
        for (const PATTERN of patterns)
        {
            for (const BASE_COLOR of baseColors)
            {
                progressives = progressives.concat(
                    getKois(BASE_COLOR, COMMON_HIGHLIGHT_COLORS, Rarity.Common, PATTERN),
                    getKois(BASE_COLOR, RARE_HIGHLIGHT_COLORS,   Rarity.Rare,   PATTERN)
                );
            }
        }

        return progressives;
    },



}

function getHighlightColors(highlightRow: string[], rarity: Rarity): string[]
{
    // common highlight colors are in columns 1-4
    // rare highlight colors are in columns 6-9
    const OFFSET: number = rarity == Rarity.Common ? 1 : 6;

    let highlightColors: string[] = [];
    for (let i=0; i<4; i++)
    {
        let highlightColor: string = highlightRow[i + OFFSET] || "";
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

function getKois(baseColor: string, highlightColors: string[], rarity: Rarity, pattern: string): SpreadsheetKoi[]
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