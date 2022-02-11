import { GaxiosError } from "gaxios";
import { google, sheets_v4 } from "googleapis";
import ErrorMessages from "../errorMessages";
import { Config } from "../util/config";
import RethrownError from "../util/rethrownError";

const SPREADSHEETS_API: sheets_v4.Resource$Spreadsheets = 
    google.sheets({version: "v4"}).spreadsheets;

/**
 * @returns Google API key
 * @throws if the Google API key cannot be obtained.
 */
function getApiKey(): string
{
    return Config.getGoogleApiKey();
}

const Spreadsheet = {

    /**
     * @param spreadsheetId - ID of the spreadsheet. Consider example sheet with URL
     * https://docs.google.com/spreadsheets/d/1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo/edit#gid=1848229055
     * This has ID 1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo
     * @returns whether this spreadsheet is valid or not 
     * @throws if the Google API key is invalid.
     */
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
            
            // otherwise the google api key could be wrong
            throw new RethrownError(
                ErrorMessages.SPREADSHEET.INVALID_GOOGLE_API_KEY, error
            );
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
                `${ErrorMessages.SPREADSHEET.CANNOT_GET_SPREADSHEET} Spreadsheet ID: ` + 
                `${spreadsheetId}, range: ${range}`,
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

        return values;
    }

};

export default Spreadsheet;