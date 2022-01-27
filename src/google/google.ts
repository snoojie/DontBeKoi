import { GaxiosError } from "gaxios";
import { google } from "googleapis";
import Config from "../util/config";
import RethrownError from "../util/rethrownError";

const Google = {

    validateSpreadsheetId: async function(spreadsheetId: string): Promise<boolean>
    {
        let apiKey: string;
        try {
            apiKey = Config.getGoogleApiKey();
        }
        catch(error)
        {
            throw new RethrownError(
                "Cannot validate spreadsheet. Cannot get Google API Key.", error
            );
        }

        google.options({
            auth: apiKey
        });
        
        // try to get the spreadsheet
        // if this throws an error, the spreadsheet ID is invalid
        try
        {
            await google.sheets({version: "v4"}).spreadsheets.get({
                spreadsheetId,
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

                // 400 should accompany error.message
                // "API key not valid. Please pass a valid API key."
                if (error.code == "400")
                {
                    throw new RethrownError(
                        "Could not validate spreadsheet. " + 
                        "Could Google API key be invalid?", 
                        error
                    );
                }
            }
            
            // unknown error
            throw new RethrownError("Could not validate spreadsheet.", error);
        }

        // since there was no error, the spreadsheet is valid
        return true;
    }

};

export default Google;