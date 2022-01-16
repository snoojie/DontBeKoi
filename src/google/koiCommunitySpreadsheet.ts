import { Color, PatternAttributes, Type } from "../koiInterfaces";
import { Google, Sheet, SheetRow } from "./google";

export class KoiCommunitySpreadsheet {

    protected readonly GOOGLE: Google;

    protected spreadsheetId: string;

    protected static SHEET_NAMES = {
        Overview: "Overview",
        Progressives: "Progressives", 
        CollectorsAM: "A-M: Collectors", 
        CollectorsNZ: "N-Z: Collectors"
    };

    protected overviewSheet: Sheet;
    protected progressiveSheet: Sheet;
    protected collectorAMSheet: Sheet;
    protected collectorNZSheet: Sheet;

    public constructor() 
    { 
        this.GOOGLE = Google.getInstance();
    }

    public async connect(spreadsheetId: string): Promise<void>
    {
        this.spreadsheetId = spreadsheetId;

        // get the google sheet
        const SHEETS: Sheet[] = await this.GOOGLE.getSheets(
            spreadsheetId,
            [
                KoiCommunitySpreadsheet.SHEET_NAMES.Overview + "!A4:I",
                KoiCommunitySpreadsheet.SHEET_NAMES.Progressives + "!I2:AN70",
                KoiCommunitySpreadsheet.SHEET_NAMES.CollectorsAM + "!B2:K",
                KoiCommunitySpreadsheet.SHEET_NAMES.CollectorsNZ + "!B2:K"
            ]
        );

        for (const SHEET of SHEETS)
        {
            switch (SHEET.properties?.title)
            {
                case KoiCommunitySpreadsheet.SHEET_NAMES.Overview:
                    this.overviewSheet = SHEET;
                    break;
                case KoiCommunitySpreadsheet.SHEET_NAMES.Progressives:
                    this.progressiveSheet = SHEET;
                    break;
                case KoiCommunitySpreadsheet.SHEET_NAMES.CollectorsAM:
                    this.collectorAMSheet = SHEET;
                    break;
                case KoiCommunitySpreadsheet.SHEET_NAMES.CollectorsNZ:
                    this.collectorNZSheet = SHEET;
                    break;
            }
        }
    }

    public getPatternsAttributes(): PatternAttributes[]
    {
        let patterns: PatternAttributes[] = [];

        // get progressive patterns
        patterns.push(...this._getPatternsAttributesFromSheet(
            this.progressiveSheet, Type.Progressive
        ));

        // get the collector patterns
        // note there's two sheets for this
        let collectorPatterns: PatternAttributes[] = 
            this._getPatternsAttributesFromSheet(this.collectorAMSheet, Type.Collector);
        collectorPatterns.push(
            ...this._getPatternsAttributesFromSheet(this.collectorNZSheet, Type.Collector)
        );
        
        // get the hatch times for collectors

        // create json of pattern names to hatch times
        // generally, the overview sheet is sorted by pattern name
        // but there was at least one pattern that wasn't....
        let hatchTimes: { [key:string] : number } = {};
        for (let overviewRow of this.GOOGLE.getSheetRows(this.overviewSheet))
        {
            const PATTERN_NAME = this.GOOGLE.getCellText(overviewRow, 0);

            // there's an empty row between patterns starting with m and n,
            // ignore that row
            if (!PATTERN_NAME)
            {
                continue;
            }

            // the pattern reference column will have text like "Covid - 5h"
            // pull just the number out as that's the hatch time
            hatchTimes[PATTERN_NAME] = 
                parseInt(this.GOOGLE.getCellText(overviewRow, 8).substring(8))
        }

        for (let pattern of collectorPatterns)
        {
            // confirm this pattern has a known hatch time
            if (!(pattern.name in hatchTimes)) 
            {
                console.error(`Pattern ${pattern.name} is in the collector sheet but not in overview sheet.`);
                continue;
            }

            // save the hatch time
            pattern.hatchTime = hatchTimes[pattern.name];
        }

        patterns.push(...collectorPatterns);

        return patterns;
    }

    private _getPatternsAttributesFromSheet(sheet: Sheet, type: Type): PatternAttributes[]
    {
        let patterns: PatternAttributes[] = [];

        const ROWS: SheetRow[] = this.GOOGLE.getSheetRows(sheet);
        for (let i=0; i+5<ROWS.length; i+=7)
        {
            // every 7 rows represents a pattern

            const PATTERN_ROWS = ROWS.slice(i, i+6);

            // progressive sheet has a pattern every 11 columns per row
            // collector sheet has only 1 pattern per row
            const PATTERNS_PER_ROW = type == Type.Progressive ? 3 : 1;
            for (let j=0; j<PATTERNS_PER_ROW; j++)
            {
                patterns.push(this._getPatternAttributesFromRows(PATTERN_ROWS, j*11, type));
            }
        }

        return patterns;
    }

    private _getPatternAttributesFromRows(
        rows: SheetRow[], columnIndex: number, type: Type
    ): PatternAttributes
    {
        // first row is the pattern name
        // the next row has the highlight colors for common and rare
        // the next 4 rows has the base colors
        
        // get pattern name
        const NAME: string = this.GOOGLE.getCellText(rows[0], columnIndex);

        // get common and rare highlight colors
        let commonColors: Color[] = [];
        let rareColors: Color[] = [];
        const HIGHLIGHT_COLORS_ROW: SheetRow = rows[1];
        for (let j=1; j<5; j++)
        {
            commonColors.push(this._getColor(HIGHLIGHT_COLORS_ROW, j+columnIndex));
            rareColors.push(this._getColor(HIGHLIGHT_COLORS_ROW, j+5+columnIndex));
        }

        // get base colors
        let baseColors: Color[] = [];
        for (let j=0; j<4; j++)
        {
            baseColors.push(this._getColor(rows[2+j], 0+columnIndex));
        }

        return {
            name: NAME,
            baseColors: baseColors,
            commonColors: commonColors,
            rareColors: rareColors,
            type: type
        };
    }

    protected _getColor(row: SheetRow, columnIndex: number): Color
    {
        // get the name
        // note that on the google sheet,
        // prefixes generally end with a dash like "Ku-",
        // and suffixes generally start with a dash like "-shiro"
        // however sometimes there is no dash at all
        let name = this.GOOGLE.getCellText(row, columnIndex);
        if (name.startsWith("-"))
        {
            name = name.substring(1);
        }
        else if (name.endsWith("-"))
        {
            name = name.slice(0, -1);
        }

        return {
            name: name,
            hex: this.GOOGLE.getCellBackgroundColor(row, columnIndex)
        }
    }

    protected _getSheetWithPattern(patternName: string): Sheet
    {
        return  patternName[0].toLowerCase()<"m" 
            ? this.collectorAMSheet
            : this.collectorNZSheet;
    }

    protected _getSheetNameWithPattern(patternName: string): string
    {
        return patternName[0].toLowerCase()<"m" 
            ? KoiCommunitySpreadsheet.SHEET_NAMES.CollectorsAM
            : KoiCommunitySpreadsheet.SHEET_NAMES.CollectorsNZ;
    }
}