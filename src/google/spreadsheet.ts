import { google, sheets_v4 } from "googleapis";
import { GaxiosError, type GaxiosResponse } from "gaxios";
import { Config } from "../util/config";
import EnhancedError from "../util/enhancedError";

export abstract class SpreadsheetError extends EnhancedError {}

export class InvalidSpreadsheetColumn extends SpreadsheetError
{
    constructor(column: number)
    {
        super(`Invalid column index: ${column}. It must be at least 0.`);
    }
}

/**
 * Error thrown when the Google API key is not set in environment variables, 
 * or when it is set but not valid.
 */
export class InvalidGoogleApiKey extends SpreadsheetError
{
    constructor(error: any)
    {
        super("The Google API key is invalid or missing.", error);
    }
}

export abstract class InvalidSpreadsheet extends SpreadsheetError {}

export class SpreadsheetNotFound extends InvalidSpreadsheet 
{
    constructor(spreadsheetId: string, error: any)
    {
        super(`Spreadsheet '${spreadsheetId}' does not exist.`, error);
    }
}

export class PrivateSpreadsheet extends InvalidSpreadsheet
{
    constructor(spreadsheetId: string, error: any)
    {
        super(`Spreadsheet '${spreadsheetId}' is private.`, error);
    }
}

/**
 * Error thrown when the spreadsheet exists, but the range does not.
 */
export class RangeNotFound extends InvalidSpreadsheet 
{
    constructor(spreadsheetId: string, range: string, error: any)
    {
        super(
            `Spreadsheet '${spreadsheetId}' does not have range '${range}'.`, error
        );
    }
}

/**
 * Wrapper for reading from Google spreadsheets.
 */
export const Spreadsheet = {

    /**
     * Throws an error if the spreadsheet is not valid. Otherwise, returns true.
     * @param spreadsheetId ID of the spreadsheet. Consider example sheet with URL
     * https://docs.google.com/spreadsheets/d/1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo/edit#gid=1848229055
     * This has ID 1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo
     * @returns true if the spreadsheet is valid
     * @throws ConfigError if the Google API key is not set in environment variables.
     * @throws InvalidGoogleApiKey if the Google API key is invalid.
     * @throws SpreadsheetNotFound if the spreadsheet does not exist.
     * @throws PrivateSpreadsheet if the spreadsheet is not shared to anyone with link.
     */
    validate: async function(spreadsheetId: string): Promise<boolean>
    {
        const API_KEY: string = Config.getGoogleApiKey();

        try
        {
            await google.sheets({version: "v4"}).spreadsheets.get({
                spreadsheetId,
                auth: API_KEY
            });
        }
        catch(error)
        {
            throwGoogleApiError(error, spreadsheetId);
        }

        return true;
    },

    /**
     * Get a table of values from a spreadsheet within a specific range.
     * @param spreadsheetId ID of the spreadsheet. Consider example sheet with URL
     * https://docs.google.com/spreadsheets/d/1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo/edit#gid=1848229055
     * This has ID 1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo
     * @param range Range in the spreadsheet, for example, Progressives!A2:G
     * @returns List of rows from the specified range and spreadsheet
     * @throws ConfigError if the Google API key is not set in environment variables.
     * @throws InvalidGoogleApiKey if the Google API key is invalid.
     * @throws SpreadsheetNotFound if the spreadsheet does not exist.
     * @throws PrivateSpreadsheet if the spreadsheet is not shared to anyone with link.
     * @throws RangeNotFound if the range is invalid.
     */
    getValues: async function(spreadsheetId: string, range: string): Promise<string[][]>
    {
        const API_KEY: string = Config.getGoogleApiKey();
        
        // get spreadsheet
        
        let values: any[][] | null | undefined;
        try
        {
            const RESPONSE: GaxiosResponse<sheets_v4.Schema$ValueRange> 
                = await google.sheets({version: "v4"}).spreadsheets.values.get({
                    spreadsheetId,
                    range,
                    auth: API_KEY
                });
            values = RESPONSE.data.values;
        }
        catch(error)
        {
            throwGoogleApiError(error, spreadsheetId, range);
        }
        
        // when all the values are empty text,
        // google for some reason returns null or undefined
        // change that to be an empty list
        if (values == null || values == undefined)
        {
            values = [];
        }

        // Since the google api returns any[][] type, 
        // you would think it supports both strings and numbers at least.
        // But no, all numbers are converted to string.
        // So why isn't this a string[][] type? 
        // Because google. That's why.
        // Lets make it a table of strings.
        return <string[][]>values;
    },

    convertColumnIndexToLetter(index: number): string
    {      
        // logic from https://stackoverflow.com/a/29220658

        if (index < 0)
        {
            throw new InvalidSpreadsheetColumn(index);
        }
        
        let tmp: number;
        let letter: string = "";
        while (index >= 0)
        {
            tmp = index % 26;
            letter = String.fromCharCode(tmp + 65) + letter;
            index = (index - tmp - 1) / 26;
        }
        return letter;
    }

};

function throwGoogleApiError(error: any, spreadsheetId: string, range?: string): void
{
    if (error instanceof GaxiosError)
    {
        if (error.code == "400")
        {
            if (error.message == 
                "API key not valid. Please pass a valid API key.")
            {
                throw new InvalidGoogleApiKey(error);
            }
            if (range && error.message.startsWith("Unable to parse range: "))
            {
                throw new RangeNotFound(spreadsheetId, range, error);
            }
        }
        if (error.code == "404" && 
            error.message == "Requested entity was not found.")
        {
            throw new SpreadsheetNotFound(spreadsheetId, error);
        }
        if (error.code == "403" && 
            error.message == "The caller does not have permission")
        {
            throw new PrivateSpreadsheet(spreadsheetId, error);
        }
    }

    // unknown error, so pass it on
    throw error;
}