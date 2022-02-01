const KoiSpreadsheet = {

    /**
     * Gets the string in the table at (row, column).
     * If there is no text in that cell, an empty string "" is returned.
     * @param table array of arrays representing the google spreadsheet values.
     * @param rowIndex index of the row to get the string from.
     * @param columnIndex index of the column to get the string from.
     * @returns string at (row, column).
     */
    getStringFromCell(table: any[][], rowIndex: number, columnIndex: number): string
    {
        const ROW: string[] = table[rowIndex] || [];
        const VALUE: string = ROW[columnIndex] || "";
        return VALUE;
    },

    /**
     * Given a table and row, returns the string at (row, 0).
     * It is expected the pattern name is in the first column of that row.
     * If there is no text in (row, 0), the empty string is returned.
     * @param table array of arrays representing the google spreadsheet values.
     * @param rowIndex index of the row to find the pattern name in.
     * @returns string at (row, 0).
     */
    getPatternNameFromRow(table: any[][], rowIndex: number): string
    {
        return KoiSpreadsheet.getStringFromCell(table, rowIndex, 0);
    },

    /**
     * The string at (row, 0) will be stripped of dashes and returned.
     * It is expected the base color is in (row, 0).
     * For example, the text at (row, 0) may be "Cha-", but "Cha" will be returned.
     * If there is no text in (row, 0), the empty string is returned.
     * @param table array of arrays representing the google spreadsheet values.
     * @param rowIndex index of the row to find the base color in.
     * @returns string at (row, 0) without a dash.
     */
    getBaseColorFromRow(table: any[][], rowIndex: number): string
    {
        let color: string = KoiSpreadsheet.getStringFromCell(table, rowIndex, 0);
        
        // strip dash if there is one
        if(color.endsWith("-"))
        {
            color = color.slice(0, -1);
        }

        return color;
    },

    /**
     * The string at (row, column) will be stripped of dashes and returned.
     * It is expected the highlight color is in (row, column).
     * For example, the text at (row, column) may be "-kura", but "kura" will be returned.
     * If there is no text in (row, column), the empty string is returned.
     * @param table array of arrays representing the google spreadsheet values.
     * @param rowIndex index of the row to find the highlight color in.
     * @returns string at (row, column) without a dash.
     */
    getHighlightColorFromColumn(
        table: any[][], rowIndex: number, columnIndex: number
    ): string
    {
        let color: string = 
            KoiSpreadsheet.getStringFromCell(table, rowIndex, columnIndex);
        
        // strip dash if there is one
        if(color.startsWith("-"))
        {
            color = color.substring(1);
        }

        return color;
    }

}

export default KoiSpreadsheet;