const KoiSpreadsheet = {

    getStringFromCell(table: any[][], rowIndex: number, columnIndex: number): string
    {
        const ROW: string[] = table[rowIndex] || [];
        const VALUE: string = ROW[columnIndex] || "";
        return VALUE;
    },

    getPatternNameFromRow(table: any[][], rowIndex: number): string
    {
        return KoiSpreadsheet.getStringFromCell(table, rowIndex, 0);
    },

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