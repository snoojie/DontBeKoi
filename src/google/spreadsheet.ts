import { GaxiosError, GaxiosResponse } from "gaxios";
import { google, sheets_v4 } from "googleapis";
import { Config } from "../util/config";
import EnhancedError from "../util/enhancedError";

/**
 * Error thrown when there was an issue accessing Google API.
 */
export class SpreadsheetError extends EnhancedError {}

const SPREADSHEETS_API: sheets_v4.Resource$Spreadsheets = 
    google.sheets({version: "v4"}).spreadsheets;

/**
 * @returns Google API key
 * @throws CongigError if the Google API key cannot be obtained.
 */
function getApiKey(): string
{
    return Config.getGoogleApiKey();
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
     * @throws ConfigError if the Google API key is not set in environment variable.
     * @throws SpreadsheetError if the Google API key is invalid.
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
            if (error instanceof GaxiosError)
            {
                // 404 should accompany error.message 
                // "Requested entity was not found."
                if (error.code == "404")
                {
                    return false;
                }
            }
            
            // otherwise the google api key could be wrong
            throw new SpreadsheetError(
                `Could not check if the spreadsheet '${spreadsheetId}' exists. ` +
                "Could the Google API key be invalid?", 
                error
            );
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
     * @throws ConfigError if the Google API key is not set in environment variable.
     * @throws SpreadsheetError if the spreadsheet ID, range, 
     *         or Google API key is invalid.
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
            throw new SpreadsheetError(
                `Could not get range '${range}' at spreadsheet '${spreadsheetId}'. ` +
                "Could the spreadsheet ID, range, or Google API key be invalid?",
                error
            );
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