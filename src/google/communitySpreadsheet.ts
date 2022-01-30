import Google from "./spreadsheet"

const SPREADSHEET_ID: string = "1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo";

export type Overview = {
    name: string;
    hatchTime: number;
}[];

export const CommunitySpreadsheet = {
    
    getOverview: async function(): Promise<Overview>
    {
        const TABLE: string[][] = 
            await Google.getValues(SPREADSHEET_ID, "Overview!A4:I");
        
        let overview: Overview = [];
        
        for (const ROW of TABLE)
        {
            // get name
            // note if name is empty, skip this row
            // there's an empty row between m and n
            const NAME: string = ROW[0] || "";
            if (!NAME)
            {
                continue;
            }

            // get the hatch time
            const COVID_VALUE: string = ROW[8] || "";
            if (!COVID_VALUE)
            {
                throw new Error(
                    `Expected a value in the last overview column, ` +
                    `but there wasn't one: ${ROW}`
                );
            }
            const HATCH_TIME: number = parseInt(COVID_VALUE.substring(8));

            overview.push({
                name: NAME,
                hatchTime: HATCH_TIME
            });
        }

        return overview;
    }

}