import { Credentials, JWT, OAuth2Client } from "google-auth-library";
import { google, sheets_v4 } from "googleapis";
import * as fs from "fs";

export class Google
{
    private static instance: Google;
    private readonly SPREADSHEET_API : sheets_v4.Resource$Spreadsheets;

    private constructor() 
    { 
        this.SPREADSHEET_API = google
            .sheets({version: "v4"})
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

    private _getReadAuth(): string
    {
        return process.env.GOOGLE_API_KEY || "";
    }

    private async _getWriteAuth(): Promise<OAuth2Client>
    {
        const TOKEN_FILE_PATH = "./src/google/token.json";
        
        let auth: OAuth2Client = new google.auth.OAuth2(
            process.env.CLIENT_ID, 
            process.env.GOOGLE_CLIENT_SECRET, 
            process.env.GOOGLE_REDIRECT_URI
        );

        // get token
        let token: Credentials | undefined;
        if (fs.existsSync(TOKEN_FILE_PATH))
        {  
            const TOKEN_STRING = fs.readFileSync(TOKEN_FILE_PATH, "utf8");
            try
            {
                // if the token has expired, this will throw an error
                await auth.getTokenInfo(TOKEN_STRING);

                // token is valid!
                token = JSON.parse(TOKEN_STRING);
            }
            catch(error) { /* invalid token, likely expired */ }
        }
        if (!token)
        {
            // either there was no token file,
            // or the token had expired
            // so get a new token

            let jwt: JWT = new google.auth.JWT(
                process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                undefined,
                process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
                "https://www.googleapis.com/auth/spreadsheets"
            );
            token = await jwt.authorize();
            fs.writeFileSync(TOKEN_FILE_PATH, JSON.stringify(token));
        }
        
        auth.setCredentials(token);

        return auth;
    }

    public async getSpreadsheet(spreadsheetId: string, ranges: string[]) : Promise<Spreadsheet>
    {
        let response;
        try 
        {
            response = await this.SPREADSHEET_API.get({
                spreadsheetId,
                ranges,
                includeGridData: true,
                auth: this._getReadAuth()
            });
        }
        catch(err)
        {
            throw "Failed to retrieve the google spreadsheet: " + err;
        }

        if (!response)
        {
            throw "Failed to retrieve the google spreadsheet due to an empty response.";
        }
    
        return <Spreadsheet>response.data;
    }

    public async updateSpreadsheet(
        spreadsheetId: string, range: string, values: string[][]
    ): Promise<void>
    {
        const AUTH: OAuth2Client = await this._getWriteAuth();
        
        await this.SPREADSHEET_API.values.update({
            spreadsheetId: spreadsheetId,
            range: range,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                "majorDimension": "ROWS",
                "range": range,
                "values": values
            },
            auth: AUTH
        });
    }

    public async getSheets(spreadsheetId: string, ranges: string[]): Promise<Sheet[]>
    {
        const SPREADSHEET = await this.getSpreadsheet(spreadsheetId, ranges);

        let sheets: Sheet[] = [];
        if (SPREADSHEET.sheets)
        {
            for (let sheet of SPREADSHEET.sheets)
            {
                sheets.push(<Sheet>sheet);
            }
        }
        return sheets;

    }

    public getSheet(spreadsheet: Spreadsheet, index: number) : Sheet
    {
        if (!spreadsheet)
        {
            throw "Cannot get sheet from empty spreadsheet";
        }
        if (!spreadsheet.sheets)
        {
            throw "Cannot get sheet when spreadsheet has no sheets";
        }
        if (spreadsheet.sheets.length < index)
        {
            throw `Cannot get sheet at index ${index} because this spreadsheet does not have any that many sheets.`;
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
        if (columnIndex >= row.values.length)
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

    public isCellEmpty(row: SheetRow, columnIndex: number): boolean
    {
        return !this.getCellText(row, columnIndex);
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

        const GOOGLE_COLOR: sheets_v4.Schema$Color | undefined = 
            FORMAT.backgroundColor;
        if (!GOOGLE_COLOR)
        {
            console.error(`Cannot get cell background color at column ${columnIndex} because the background color style is unknown: ${row}`);
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
