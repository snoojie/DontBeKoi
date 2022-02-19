import { GaxiosError, GaxiosResponse } from "gaxios";
import { google, sheets_v4 } from "googleapis";
import { Config } from "../util/config";
import EnhancedError from "../util/enhancedError";

/**
 * Base error that should never be directly thrown.
 */
export abstract class SpreadsheetError extends EnhancedError {}

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

/**
 * Error thrown when the spreadsheet could not be found due to an invalid ID.
 */
export class InvalidSpreadsheet extends SpreadsheetError 
{
    constructor(spreadsheetId: string, error: any)
    {
        super(`Spreadsheet ID '${spreadsheetId}' does not exist.`, error);
    }
}

/**
 * Error thrown when the spreadsheet exists, but the range does not.
 */
export class RangeNotFound extends SpreadsheetError 
{
    constructor(spreadsheetId: string, range: string, error: any)
    {
        super(
            `Spreadsheet ID '${spreadsheetId}' does not have range '${range}'.`, error
        );
    }
}

const SPREADSHEETS_API: sheets_v4.Resource$Spreadsheets = 
    google.sheets({version: "v4"}).spreadsheets;

/**
 * @returns Google API key
 * @throws InvalidGoogleApiKey if the Google API key cannot be obtained.
 */
function getApiKey(): string
{
    try
    {
        return Config.getGoogleApiKey();
    }
    catch(error)
    {
        throw new InvalidGoogleApiKey(error);
    }
}

/**
 * Wrapper for reading from Google spreadsheets.
 */
export const Spreadsheet = {

    /**
     * @param spreadsheetId - ID of the spreadsheet. Consider example sheet with URL
     * https://docs.google.com/spreadsheets/d/1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo/edit#gid=1848229055
     * This has ID 1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo
     * @returns whether this spreadsheet exists or not 
     * @throws InvalidGoogleApiKey if the Google API key is not set in
     *         environment variable or is invalid.
     */
    exists: async function(spreadsheetId: string): Promise<boolean>
    {
        // throws ConfigError if api key not set as environment variable
        const API_KEY: string = getApiKey();
        
        // try to get the spreadsheet
        // if this throws an error, then either 
        // the spreadsheet ID is invalid
        // or the google api key is invalid
        try
        {
            await SPREADSHEETS_API.get({
                spreadsheetId,
                auth: API_KEY
            });
        }
        catch(error)
        {
            if (isGoogleErrorOfInvalidGoogleApiKey(error))
            {
                throw new InvalidGoogleApiKey(error);
            }
            if (isGoogleErrorOfInvalidSpreadsheet(error))
            {
                return false;
            }
        }

        // since there was no error, the spreadsheet is valid
        return true;
    },

    /**
     * Get a table of values from a spreadsheet within a specific range.
     * @param spreadsheetId ID of the spreadsheet. Consider example sheet with URL
     * https://docs.google.com/spreadsheets/d/1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo/edit#gid=1848229055
     * This has ID 1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo
     * @param range Range in the spreadsheet, for example, Progressives!A2:G
     * @returns List of rows from the specified range and spreadsheet
     * @throws InvalidGoogleApiKey if the Google API key is invalid.
     * @throws InivalidSpreadsheet if the spreadsheet ID is invalid.
     * @throws RangeNotFound if the spreadsheet exists but the range is invalid.
     */
    getValues: async function(spreadsheetId: string, range: string): Promise<string[][]>
    {
        const API_KEY: string = getApiKey();
        
        // get spreadsheet
        
        let values: any[][] | null | undefined;
        try
        {
            const RESPONSE: GaxiosResponse<sheets_v4.Schema$ValueRange> 
                = await SPREADSHEETS_API.values.get({
                    spreadsheetId,
                    range,
                    auth: API_KEY
                });
            values = RESPONSE.data.values;
        }
        catch(error)
        {
            if(isGoogleErrorOfInvalidGoogleApiKey(error))
            {
                throw new InvalidGoogleApiKey(error);
            }
            if(isGoogleErrorOfInvalidSpreadsheet(error))
            {
                throw new InvalidSpreadsheet(spreadsheetId, error);
            }
            if(isGoogleErrorOfRangeNotFound(error))
            {
                throw new RangeNotFound(spreadsheetId, range, error);
            }
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
    }

};

function isGoogleErrorOfInvalidGoogleApiKey(error: any): boolean
{
    return error instanceof GaxiosError && 
           error.code == "400" && 
           error.message == "API key not valid. Please pass a valid API key.";
}

function isGoogleErrorOfInvalidSpreadsheet(error: any): boolean
{
    return error instanceof GaxiosError && 
           error.code == "404" && 
           error.message == "Requested entity was not found.";
}

function isGoogleErrorOfRangeNotFound(error: any): boolean
{
    return error instanceof GaxiosError && 
           error.code == "400" && 
           error.message.startsWith("Unable to parse range: ");
}