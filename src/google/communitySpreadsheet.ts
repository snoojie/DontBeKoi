import { PatternType } from "../types";
import Google from "./spreadsheet"

const SPREADSHEET_ID: string = "1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo";

export type OverviewEntry = {
    name: string;
    hatchTime?: number;
    type: PatternType;
};

export type Overview = OverviewEntry[];

export const CommunitySpreadsheet = {
    
    getOverview: async function(): Promise<Overview>
    {
        const OVERVIEW_PROMISES: Promise<Overview>[] = [
            getOverview(PatternType.Collector),
            getOverview(PatternType.Progressive)
        ];
        const OVERVIEW: Overview = (await Promise.all(OVERVIEW_PROMISES)).flat();
        return OVERVIEW;
    }

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