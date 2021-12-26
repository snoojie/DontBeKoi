import { Google, Spreadsheet, Sheet, SheetRow } from "./google";

export interface KoiColoring
{
    name: string;
    baseColor: string;
    highlightColor: string;
}

export interface PatternCollection 
{
    commons: KoiColoring[];
    rares: KoiColoring[];
    hatchTime: number;
}

interface ColorData
{
    name: string;
    color: string;
}

export class PatternUtil
{
    public static async getCollection(pattern: string): Promise<PatternCollection>
    {
        let google: Google = Google.getInstance();

        //https://docs.google.com/spreadsheets/d/1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo

        // there are two sheets
        // one for patterns beginning with A-M,
        // and another for N-Z
        let collectorRange = pattern[0]<"n" ? "A-M" : "N-Z";
        collectorRange += ": Collectors!B2:K";

        // there is yet another sheet that lists the hatch time
        let overviewRange = "Overview!A4:I";
        
        const SPREADSHEET: Spreadsheet | undefined = await google.getSpreadsheet(
            "1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo",
            [overviewRange, collectorRange]
        );
        if (!SPREADSHEET)
        {
            throw "Could not get google spreadsheet";
        }

        // get sheets
        const COLOR_SHEET = google.getSheet(SPREADSHEET, 1);
        if (!COLOR_SHEET)
        {
            throw "Could not get the color google sheet";
        }
        const HATCH_TIME_SHEET = google.getSheet(SPREADSHEET, 0);
        if (!HATCH_TIME_SHEET)
        {
            throw "Could not get the hatch time google sheet";
        }

        

        // find the row containing the hatch time
        const HATCH_TIME_ROWS = google.getSheetRows(HATCH_TIME_SHEET);
        let hatchTimeRow: SheetRow | undefined = undefined;
        for (let row of HATCH_TIME_ROWS)
        {
            const FOUND_PATTERN = google.getCellText(row, 0);
            if (!FOUND_PATTERN)
            {
                // reached end of sheet or middle between "m" and "n"
                continue;
            }

            if (FOUND_PATTERN.toLowerCase() == pattern)
            {
                // found our pattern!
                hatchTimeRow = row;
                break;
            }
        }
        if (!hatchTimeRow)
        {
            throw `Pattern ${pattern} is invalid.`;
        }
        
        // the hatch time column will have text like "10h"
        const ORIGINAL_HATCH_TIME = parseInt(google.getCellText(hatchTimeRow, 7));

        // the pattern reference column will have text like "Covid - 5h"
        // pull just the number out
        const REDUCTION_TIME = parseInt(google.getCellText(hatchTimeRow, 8).substring(8));

        const HATCH_TIME = ORIGINAL_HATCH_TIME - REDUCTION_TIME;

        let commonSuffixes: ColorData[] = [];
        let rareSuffixes: ColorData[] = [];
        let prefixes: ColorData[] = [];

        // find our pattern in the color sheet
        const COLOR_ROWS: SheetRow[] = google.getSheetRows(COLOR_SHEET);
        let patternIndex: number | undefined = undefined;
        for (let i=0; i<COLOR_ROWS.length; i+=7)
        {
            // every 7 rows lists a pattern
            // see if this matches the one we are looking for

            let foundPattern: string = google.getCellText(COLOR_ROWS[i], 0);
            if (foundPattern.toLowerCase() == pattern)
            {
                // found our pattern!
                patternIndex = i;

                break;
            }
        }
        if (!patternIndex)
        {
            throw `Pattern ${pattern} is invalid`;
        }

        // the next row will have the suffixes
        // columns 1-4 have the common suffix
        // columns 6-9 have the rare suffix
        const SUFFIXES_ROW = COLOR_ROWS[patternIndex + 1]; 
        for (let i=1; i<5; i++)
        {
            commonSuffixes.push(getColorData(SUFFIXES_ROW, i));
            rareSuffixes.push(getColorData(SUFFIXES_ROW, i+5));
        }

        // the following 4 rows after suffix row will have the prefixes
        for (let i=patternIndex+2; i<patternIndex+6; i++)
        {
            prefixes.push(getColorData(COLOR_ROWS[i], 0));
        }

        // using the prefixes and suffixes we found,
        // we can now build the list of common and rare collections
        let commons: KoiColoring[] = [];
        let rares: KoiColoring[] = [];
        for (let prefix of prefixes)
        {
            commons.push(...joinPrefixWithSuffixes(prefix, commonSuffixes));
            rares.push(...joinPrefixWithSuffixes(prefix, rareSuffixes));
        }

        let collection: PatternCollection = {
            commons,
            rares,
            hatchTime: HATCH_TIME
        };

        return collection;

        function getColorData(row: SheetRow, columnIndex: number) : ColorData
        {
            // strip name of a dash, example
            // prefix "Ore-" and suffix "-koji"
            // note there's some typos where there are no dashes
            let name: string = google.getCellText(row, columnIndex);
            if (name.startsWith("-"))
            {
                name = name.substring(1);
            }
            else if (name.charAt(name.length - 1) == "-")
            {
                name = name.slice(0, -1);
            }
            // else, the spreadsheet has a typo and is missing the dash

            const COLOR = google.getCellBackgroundColor(row, columnIndex);

            const COLOR_DATA: ColorData = {
                name: name,
                color: COLOR
            };

            return COLOR_DATA;
        }

        function joinPrefixWithSuffixes(prefix: ColorData, suffixes: ColorData[]): KoiColoring[]
        {
            let collection: KoiColoring[] = [];

            for (let suffix of suffixes)
            {
                const SINGLE_FISH: KoiColoring = {
                    name: prefix.name + suffix.name,
                    baseColor: prefix.color,
                    highlightColor: suffix.color
                };
                collection.push(SINGLE_FISH);
            }

            return collection;
        }

    }
}

