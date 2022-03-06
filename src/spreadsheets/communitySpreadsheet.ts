import { Spreadsheet } from "./spreadsheet"
import { KoiSpreadsheet, Patterns } from "./koiSpreadsheet";

const SPREADSHEET_ID: string = "1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo";

/**
 * Represents Coris's google spreadsheet.
 */
export const CommunitySpreadsheet = {
    
    /**
     * Read Coris's google spreadsheet to get information about all patterns.
     * @returns Info on all patterns.
     */
    getAllPatterns: async function(): Promise<Patterns>
    {
        let patterns: Patterns = await Promise.all([ 
            KoiSpreadsheet.getProgressives(SPREADSHEET_ID),
            KoiSpreadsheet.getCollectorsAM(SPREADSHEET_ID),
            KoiSpreadsheet.getCollectorsNZ(SPREADSHEET_ID),
            Spreadsheet.getValues(SPREADSHEET_ID, "Overview!A4:I")
        ]).then(results => {
            let progressives: Patterns = results[0];
            let collectors: Patterns = new Map([...results[1], ...results[2]]);

            // add hatch times for collectors
            const OVERVIEW: string[][] = results[3];
            for (let i=0; i<OVERVIEW.length; i++)
            {
                const PATTERN_NAME: string = KoiSpreadsheet.getValue(OVERVIEW, i, 0);

                // skip the blank row between m- and n- patterns
                if (!PATTERN_NAME)
                {
                    continue;
                }

                // get the hatch time
                const HATCH_TIME: number = 
                    parseInt(KoiSpreadsheet.getValue(OVERVIEW, i, 8).substring(8));

                // save this hatch time on its collector
                let collector = collectors.get(PATTERN_NAME);
                if (collector)
                {
                    collector.hatchTime = HATCH_TIME;
                }
            }

            return new Map([...progressives, ...collectors]);
        });

        return patterns;
    }

}