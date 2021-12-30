import { google, sheets_v4 } from "googleapis";

export class Google
{
    private static instance: Google;
    private readonly SPREADSHEET_API : sheets_v4.Resource$Spreadsheets;

    private constructor() 
    { 
        this.SPREADSHEET_API = google
            .sheets({version: 'v4', auth: process.env.GOOGLE_API_KEY})
            .spreadsheets;
    }

    public static getInstance(): Google 
    {
        if (!Google.instance) 
        {
            Google.instance = new Google();
        }

        return Google.instance;
    }

    public async getSpreadsheet(spreadsheetId: string, ranges: string[]) : Promise<Spreadsheet | undefined>
    {
        let response;
        try 
        {
            response = await this.SPREADSHEET_API.get({
                spreadsheetId,
                ranges,
                includeGridData: true
            });
        }
        catch(err)
        {
            console.error("Failed to retrieve the google sheet: " + err);
            return;
        }

        if (!response)
        {
            console.error("Failed to retrieve the google sheet due to an empty response.")
            return;
        }
    
        return <Spreadsheet>response.data;
    }

    public getSheet(spreadsheet: Spreadsheet, index: number) : Sheet | undefined
    {
        if (!spreadsheet)
        {
            console.error("Cannot get sheet from empty spreadsheet");
            return;
        }
        if (!spreadsheet.sheets)
        {
            console.error("Cannot get sheet when spreadsheet has no sheets");
            return;
        }
        if (spreadsheet.sheets.length < index)
        {
            console.error(`Cannot get sheet at index ${index} because this spreadsheet does not have any that many sheets.`);
            return;
        }

        return <Sheet>spreadsheet.sheets[index];
    }

    public getSheetRows(sheet: Sheet): SheetRow[]
    {
        if (!sheet.data || !sheet.data[0].rowData)
        {
            return [];
        }

        return <SheetRow[]>sheet.data[0].rowData;
    }

    public getCellText(row: SheetRow, columnIndex: number): string
    {
        if (!row.values)
        {
            console.error(`Sheet row does not have any values: ${row}`);
            return "";
        }
        if (row.values.length < columnIndex)
        {
            console.error(`Sheet row does not have a column at ${columnIndex}: ${row}`);
            return "";
        }
        let text : string | null | undefined = row.values[columnIndex].formattedValue;
        if (!text)
        {
            return "";
        }
        return text;
    }

    //https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/other#Color
    private convertToRgbColorLayer(googleColorLayer: number | undefined | null) : number
    {
        const FRAC: number = googleColorLayer || 0.0;
        const RGB_COLOR_LAYER: number = Math.floor(FRAC * 255);
        return RGB_COLOR_LAYER;
    }

    public getCellBackgroundColor(row: SheetRow, columnIndex: number): string
    {
        // example: { red: 0.87058824, green: 0.87058824, blue: 0.87058824 }
        const VALUES: sheets_v4.Schema$CellData[] | undefined = row.values;
        if (!VALUES)
        {
            console.error(`Cannot get cell background color when row is empty: ${row}`);
            return "";
        }
        if(VALUES.length < columnIndex)
        {
            console.error(`Cannot get cell background color when row does not have column at index ${columnIndex}: ${row}`);
            return "";
        }

        const FORMAT: sheets_v4.Schema$CellFormat | undefined = 
            VALUES[columnIndex].effectiveFormat;
        if (!FORMAT)
        {
            console.error(`Cannot get cell background color at column ${columnIndex} because the format is unknown: ${row}`);
            return "";
        }

        const STYLE: sheets_v4.Schema$ColorStyle | undefined = 
            FORMAT.backgroundColorStyle;
        if (!STYLE)
        {
            console.error(`Cannot get cell background color at column ${columnIndex} because the background color style is unknown: ${row}`);
            return "";
        }

        const GOOGLE_COLOR: sheets_v4.Schema$Color | undefined = STYLE.rgbColor;
        if (!GOOGLE_COLOR)
        {
            console.error(`Cannot get background cell color at column ${columnIndex} because its rgb color is missing: ${row}`);
            return "";
        }

        // we want to convert google color to normal rgb values
        // so the above example should be
        // { red: 222, green: 222, blue: 222 }
        const RED: number = this.convertToRgbColorLayer(GOOGLE_COLOR.red);
        const GREEN: number = this.convertToRgbColorLayer(GOOGLE_COLOR.green);
        const BLUE: number = this.convertToRgbColorLayer(GOOGLE_COLOR.blue);

        const RGB_NUMBER: Number = new Number((RED << 16) | (GREEN << 8) | BLUE);
        const HEX_STRING: string = RGB_NUMBER.toString(16);
        const MISSING_ZEROES: number = 6 - HEX_STRING.length;
        let resultBuilder: string[] = ['#'];
        for (let i = 0; i < MISSING_ZEROES; i++) {
            resultBuilder.push('0');
        }
        resultBuilder.push(HEX_STRING);
        return resultBuilder.join('');
    }
}

// rename google objects so no one else needs to know google specifics
export interface Spreadsheet extends sheets_v4.Schema$Spreadsheet {}
export interface Sheet extends sheets_v4.Schema$Sheet {};
export interface SheetRow extends sheets_v4.Schema$RowData {};