import EnhancedError from "../util/enhancedError";

export class KoiSpreadsheetError extends EnhancedError {}

/**
 * Helper functions for a Koi google spreadsheet.
 */
export const KoiSpreadsheet = {

    /**
     * Gets the string in the table at (row, column).
     * Accent characters are replaced by their non accent characters.
     * If there is no text in that cell, or the row or column index is out of bounds, 
     * an empty string "" is returned.
     * @param table array of arrays representing the google spreadsheet values.
     * @param rowIndex index of the row to get the string from.
     * @param columnIndex index of the column to get the string from.
     * @returns string at (row, column).
     */
    getValue(table: string[][], rowIndex: number, columnIndex: number): string
    {
        const ROW: string[] = table[rowIndex] || [];
        let value: string = ROW[columnIndex] || "";
        value = value.normalize("NFD").replace(/\p{Diacritic}/gu, "");
        return value;
    },

    /**
     * Given a row, it is expected the pattern name is in the first column.
     * The column assumption can be overwritten though. 
     * This is useful for the Progressives sheet which has 3 patterns per row.
     * This method returns the normalized pattern name, ie, no accented characters.
     * @param spreadsheetId ID of the spreadsheet. Used only for error messaging.
     * @param table array of arrays representing the google spreadsheet values.
     * @param rowIndex index of the row to find the pattern name in.
     * @returns normalized string at (row, 0).
     * @throws KoiSpreadsheetError if there is no pattern name in the row.
     */
    getPattern(
        spreadsheetId: string, 
        table: string[][], 
        rowIndex: number, 
        columnIndex: number = 0
    ): string
    {
        const PATTERN: string = KoiSpreadsheet.getValue(table, rowIndex, columnIndex);
        if (!PATTERN)
        {
            throw new KoiSpreadsheetError(
                `Missing pattern name in row ${rowIndex}, column ${columnIndex} ` +
                `of spreadsheet ${spreadsheetId}.`
            );
        }
        return PATTERN;
    },

    /**
     * Given a row, it is expected the base color name will be at column 0.
     * The column assumption can be overwritten though. 
     * This is useful for the Progressives sheet which has 3 patterns per row.
     * The base color name will be stripped of dashes and accents then returned.
     * For example, if the text is "Cha-", the return value will be "Cha".
     * @param spreadsheetId ID of the spreadsheet. Used only for error messaging.
     * @param table array of arrays representing the google spreadsheet values.
     * @param rowIndex index of the row to find the base color in.
     * @returns normalized string at (row, 0) without a dash.
     * @throws KoiSpreadsheetError if there is no base color in the row.
     */
    getBaseColor(
        spreadsheetId: string, 
        table: string[][], 
        rowIndex: number, 
        columnIndex: number = 0
    ): string
    {
        let color: string = KoiSpreadsheet.getValue(table, rowIndex, columnIndex);
        if (!color)
        {
            throw new KoiSpreadsheetError(
                `Missing base color name in row ${rowIndex}, column ${columnIndex} ` +
                `of spreadsheet ${spreadsheetId}.`
            );
        }
        
        // strip dash if there is one
        if(color.endsWith("-"))
        {
            color = color.slice(0, -1);
        }

        return color;
    },

    /**
     * It is assumed the highlight color is at (row, column).
     * It will be stripped of dashes and accents then returned.
     * For example, if the text is "-kura", the return value will be "kura".
     * If there is no text in (row, column), the empty string is returned.
     * @param spreadsheetId ID of the spreadsheet. Used only for error messaging.
     * @param table array of arrays representing the google spreadsheet values.
     * @param rowIndex index of the row to find the highlight color in.
     * @returns normalized string at (row, column) without a dash.
     * @throws KoiSpreadsheetError if there is no highlight color in that cell.
     */
    getHighlightColor(
        spreadsheetId: string, 
        table: string[][], 
        rowIndex: number, 
        columnIndex: number
    ): string
    {
        let color: string = KoiSpreadsheet.getValue(table, rowIndex, columnIndex);
        if (!color)
        {
            throw new KoiSpreadsheetError(
                `Missing highlight color name in row ${rowIndex}, column ${columnIndex} ` +
                `of spreadsheet ${spreadsheetId}.`
            );
        }
        
        // strip dash if there is one
        if(color.startsWith("-"))
        {
            color = color.substring(1);
        }

        return color;
    }

}