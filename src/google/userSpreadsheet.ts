import { Koi, KoiSpreadsheet, KoiSpreadsheetError, Pattern, Patterns, Progress } from "./koiSpreadsheet";
import { PatternType } from "../types";

export abstract class UserSpreadsheetError extends KoiSpreadsheetError {}

export abstract class UserSpreadsheetMissingData extends UserSpreadsheetError {}

export class UserSpreadsheetMissingPattern extends UserSpreadsheetMissingData 
{
    constructor(spreadsheetId: string, pattern: string)
    {
        super(`Spreadsheet '${spreadsheetId}' missing pattern '${pattern}'.`);
    }
}

export class UserSpreadsheetMissingKoi extends UserSpreadsheetMissingData 
{
    constructor(spreadsheetId: string, pattern: string, koi: string)
    {
        super(
            `Spreadsheet '${spreadsheetId}' missing koi '${koi}' ` +
            `for pattern '${pattern}'.`
        );
    }
}

/**
 * A user's google spreadsheet with their koi collection.
 */
export const UserSpreadsheet = {

    /**
     * Checks if this user has a specific koi or not.
     * @param spreadsheetId ID of the user's spreadsheet.
     * @param color Koi's color.
     * @param pattern Koi's pattern.
     * @returns true or false.
     * @throws ConfigError if Google Api key is not set in environment variables.
     * @throws InvalidGoogleApiKey if Google API key is invalid
     * @throws SpreadsheetNotFound if spreadsheet does not exist.
     * @throws PrivateSpreadsheet if the spreadsheet is private.
     * @throws PatternNotInSpreadsheet if the spreadsheet does not have the pattern.
     * @throws KoiNotInSpreadsheet if the spreadsheet has the pattern but not color.
     * @throws UnknownKoiProgress if the koi is not marked with k or d, or left empty.
     * @throws RangeNotFound if the range does not exist for the spreadsheet.
     */
    hasKoi: async function(
        spreadsheetId: string, koiName: string, patternName: string, type: PatternType
    ): Promise<boolean>
    {
        // get pattern from sheet
        const PATTERNS: Patterns = await (type == PatternType.Collector
            ? patternName.slice(0,1) < "n" 
                ? KoiSpreadsheet.getCollectorsAM(spreadsheetId)
                : KoiSpreadsheet.getCollectorsNZ(spreadsheetId)
            : KoiSpreadsheet.getProgressives(spreadsheetId));

        // find the pattern
        const PATTERN: Pattern | undefined = 
            PATTERNS.get(capitalizeFirstLetter(patternName));
        if (!PATTERN)
        {
            throw new UserSpreadsheetMissingPattern(spreadsheetId, patternName);
        }

        // find the koi
        const KOI: Koi | undefined = PATTERN.kois.get(capitalizeFirstLetter(koiName));
        if (!KOI)
        {
            throw new UserSpreadsheetMissingKoi(spreadsheetId, patternName, koiName);
        }

        return KOI.progress == Progress.KOI_IN_COLLECTION || 
               KOI.progress == Progress.DRAGON_IN_COLLECTION;
    } 

};

function capitalizeFirstLetter(text: string): string
{
    return text.slice(0, 1).toUpperCase() + text.substring(1).toLowerCase();
}