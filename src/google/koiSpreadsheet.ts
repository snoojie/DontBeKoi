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
    normalizeCell(table: string[][], rowIndex: number, columnIndex: number): string
    {
        const ROW: string[] = table[rowIndex] || [];
        let value: string = ROW[columnIndex] || "";
        value = value.normalize("NFD").replace(/\p{Diacritic}/gu, "");
        return value;
    },

    /**
     * Given a row, it is expected the pattern name is in the first column.
     * This method returns the normalized pattern name, ie, no accented characters.
     * @param table array of arrays representing the google spreadsheet values.
     * @param rowIndex index of the row to find the pattern name in.
     * @returns normalized string at (row, 0).
     * @throws KoiSpreadsheetError if there is no pattern name in the row.
     */
    getPattern(table: string[][], rowIndex: number): string
    {
        const PATTERN: string = KoiSpreadsheet.normalizeCell(table, rowIndex, 0);
        if (!PATTERN)
        {
            throw new KoiSpreadsheetError(`Missing pattern name in row ${rowIndex}.`);
        }
        return PATTERN;
    },

    /**
     * Given a row, it is expected the base color name will be at column 0.
     * The base color name will be stripped of dashes and accents then returned.
     * For example, if the text is "Cha-", the return value will be "Cha".
     * @param table array of arrays representing the google spreadsheet values.
     * @param rowIndex index of the row to find the base color in.
     * @returns normalized string at (row, 0) without a dash.
     * @throws KoiSpreadsheetError if there is no base color in the row.
     */
    getBaseColor(table: string[][], rowIndex: number): string
    {
        let color: string = KoiSpreadsheet.normalizeCell(table, rowIndex, 0);
        if (!color)
        {
            throw new KoiSpreadsheetError(`Missing base color name in row ${rowIndex}.`);
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
     * @param table array of arrays representing the google spreadsheet values.
     * @param rowIndex index of the row to find the highlight color in.
     * @returns normalized string at (row, column) without a dash.
     * @throws KoiSpreadsheetError if there is no highlight color in that cell.
     */
    getHighlightColor(table: string[][], rowIndex: number, columnIndex: number): string
    {
        let color: string = KoiSpreadsheet.normalizeCell(table, rowIndex, columnIndex);
        if (!color)
        {
            throw new KoiSpreadsheetError(
                `Missing highlight color name in row ${rowIndex}, column ${columnIndex}.`
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