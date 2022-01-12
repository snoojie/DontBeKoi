import { Google, Sheet, SheetRow } from "./google";
import { Color, Type } from "../koiInterfaces";
import { KoiCommunitySpreadsheet } from "./koiCommunitySpreadsheet";
import { Pattern } from "../db/pattern";

export interface KoiProgress
{
    name: string;
    base: Color;
    highlight: Color;
    owned: boolean;
    dragonned: boolean;
    value: string;
}

export interface KoisProgress
{
    [name:string]: KoiProgress;
}

export interface PatternProgress
{
    name: string;
    common: KoiProgress[];
    rare: KoiProgress[];
    sheetRowNumber: number;
}

export class UserKoiSpreadsheet extends KoiCommunitySpreadsheet {

    public constructor() 
    { 
        super();
    }

    public isMissingKoi(patternName: string, colorName: string): boolean
    {
        const PATTERN_PROGRESS: PatternProgress | undefined = 
            this._getPatternProgress(patternName);
        if (!PATTERN_PROGRESS)
        {
            throw new Error(`Pattern ${patternName} does not exist.`);
        }

        for (const KOI_PROGRESS of [...PATTERN_PROGRESS.common, ...PATTERN_PROGRESS.rare])
        {
            if (KOI_PROGRESS.name.toLowerCase() == colorName.toLowerCase())
            {
                return !KOI_PROGRESS.owned;
            }
        }
        
        // if this is reached, this pattern does not include this color
        throw new Error(`Pattern ${patternName} does not have color ${colorName}.`);
    }

    public getMissingKois(patternName: string): KoisProgress | undefined
    {
        // get list of all koi from this pattern
        const PATTERN_PROGRESS = this._getPatternProgress(patternName);
        if (!PATTERN_PROGRESS)
        {
            // pattern not found in google spreadsheet
            return;
        }

        // get koi that are not yet owned
        let missingKois: KoisProgress = {};
        // todo should the commons and rares be separated?
        for (const KOI_PROGRESS of [...PATTERN_PROGRESS.common, ...PATTERN_PROGRESS.rare])
        {
            if (!KOI_PROGRESS.owned)
            {
                missingKois[KOI_PROGRESS.name] = KOI_PROGRESS;
            }
        }

        return missingKois;
    }

    public _getPatternProgress(patternName: string): PatternProgress | undefined
    {
        // get the sheet with this pattern
        const SHEET: Sheet = this._getSheetWithPattern(patternName);
        const SHEET_NAME: string = this.GOOGLE.getSheetName(SHEET);

        // get the rows representing this pattern
        let patternRows: SheetRow[] = [];
        let patternRowNumber: number = -1;
        const SHEET_ROWS: SheetRow[] = this.GOOGLE.getSheetRows(SHEET);
        for (let i=0; i+5<SHEET_ROWS.length; i+=7)
        {
            // every 7 rows represents a pattern

            if(patternName.toLowerCase() == 
               this.GOOGLE.getCellText(SHEET_ROWS[i], 0).toLowerCase()
            )
            {
                // found our pattern!
                patternRowNumber = i+2;
                patternRows = SHEET_ROWS.slice(i, i+6);
            }
        }
        if (patternRows.length==0)
        {
            // pattern not in spreadsheet
            return;
        }

        // get the progress of this pattern
        let commonProgress: KoiProgress[] = [];
        let rareProgress: KoiProgress[] = [];
        for (let rowIndex=2; rowIndex<6; rowIndex++)
        {
            for (let columnIndex=1; columnIndex<5; columnIndex++)
            {
                commonProgress.push(
                    this._getKoiProgress(patternRows, rowIndex, columnIndex)
                );
                rareProgress.push(
                    this._getKoiProgress(patternRows, rowIndex, columnIndex+5)
                );
            }
        }
        return {
            name: patternName,
            common: commonProgress,
            rare: rareProgress,
            sheetRowNumber: patternRowNumber
        };
    }

    private _getKoiProgress(
        patternRows: SheetRow[], 
        baseColorRowIndex: number, 
        highlightColorRowIndex: number
    ): KoiProgress
    {
        const BASE: Color = this._getColor(patternRows[baseColorRowIndex], 0);
        const HIGHLIGHT: Color = this._getColor(patternRows[1], highlightColorRowIndex);

        const VALUE: string = this.GOOGLE.getCellText(
            patternRows[baseColorRowIndex], highlightColorRowIndex
        );

        return { 
            name: BASE.name + HIGHLIGHT.name,
            base: BASE,
            highlight: HIGHLIGHT,
            owned: VALUE != "",
            dragonned: VALUE == "d",
            value: VALUE
        };
    }

    public async updateKoisProgress(patternName: string, koisToUpdate: KoisProgress): Promise<void>
    {
        // get all kois in this pattern
        let patternProgress: PatternProgress | undefined = 
            this._getPatternProgress(patternName);
        if (!patternProgress)
        {
            // this pattern is not in the google spreadsheet
            return;
        }

        // go through pattern progress and update ownership values
        for (let koiProgress of [...patternProgress.common, ...patternProgress.rare])
        {
            const KOI_TO_UPDATE = koisToUpdate[koiProgress.name];
            if (KOI_TO_UPDATE)
            {
                koiProgress.owned = KOI_TO_UPDATE.owned;
            }
        }
        
        // convert the pattern progress collection to a table that google can read
        let values: string[][] = [];
        for (let rowIndex=0; rowIndex<4; rowIndex++)
        {
            // first four values are for the commons
            let row: string[] = this._getRowValuesFromPatternProgress(
                patternProgress.common, rowIndex
            );

            // next value is empty
            row.push("");

            // last four values are for the rares
            row.push(...this._getRowValuesFromPatternProgress(
                patternProgress.rare, rowIndex
            ));

            values.push(row);
        }

        const SHEET_NAME: string = this._getSheetNameWithPattern(patternName);
        const START_ROW_NUMBER: number = patternProgress.sheetRowNumber+2;

        await this.GOOGLE.updateSpreadsheet(
            this.spreadsheetId,
            `${SHEET_NAME}!C${START_ROW_NUMBER}:K${START_ROW_NUMBER+4}`,
            values
        );
    }

    private _getRowValuesFromPatternProgress(
        collectionProgress: KoiProgress[], rowIndex: number
    ): string[]
    {
        let row: string[] = [];
        for (let columnIndex=0; columnIndex<4; columnIndex++)
        {
            const KOI_PROGRESS: KoiProgress = collectionProgress[4*rowIndex + columnIndex];
            const VALUE = KOI_PROGRESS.dragonned ? "d" :
                KOI_PROGRESS.owned ? "k" :
                "";
            row.push(VALUE);
        }
        return row;
    }
}