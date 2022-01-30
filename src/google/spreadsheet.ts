import { GaxiosError } from "gaxios";
import { google, sheets_v4 } from "googleapis";
import Config from "../util/config";
import RethrownError from "../util/rethrownError";

const SPREADSHEETS_API: sheets_v4.Resource$Spreadsheets = 
    google.sheets({version: "v4"}).spreadsheets;

/**
 * @returns Google API key
 * @throws if the Google API key cannot be obtained.
 */
function getApiKey(): string
{
    let apiKey: string;
    try {
        apiKey = Config.getGoogleApiKey();
    }
    catch(error)
    {
        throw new RethrownError("Cannot get Google API Key.", error);
    }
    return apiKey;
}

const Spreadsheet = {

    validateId: async function(spreadsheetId: string): Promise<boolean>
    {
        const API_KEY: string = getApiKey();
        
        // try to get the spreadsheet
        // if this throws an error, the spreadsheet ID is invalid
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
            
            // unknown error
            throw new RethrownError("Could not validate spreadsheet.", error);
        }

        // since there was no error, the spreadsheet is valid
        return true;
    },

    getValues: async function(spreadsheetId: string, range: string): Promise<any[][]>
    {
        const API_KEY: string = getApiKey();
        
        // get spreadsheet values
        let values: any[][] | null | undefined;
        try
        {
            let response = await SPREADSHEETS_API.values.get({
                spreadsheetId,
                range,
                auth: API_KEY
            });
            values = response.data.values;
        }
        catch(error)
        {
            throw new RethrownError(
                `Could not get spreadsheet. Could the spreadsheet ID ` +
                `${spreadsheetId} or range ${range} be invalid?`,
                error
            );
        }
        if (!values)
        {
            // this shouldn't happen
            throw new Error(
                `Spreadsheet ${spreadsheetId} with range ${range} returned empty values.`
            );
        }

        return values;
    }

};

export default Spreadsheet;