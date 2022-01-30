import { Sequelize } from "sequelize";
import { CommunitySpreadsheet, Overview } from "../../google/communitySpreadsheet";
import RethrownError from "../../util/rethrownError";
import { Pattern, initModel, PatternAttributes } from "../models/pattern";

const PatternDal = {

    name: "Pattern",
    
    /**
     * Initializes the Pattern table.
     * @param sequelize Database connection
     * @throws if the Pattern table could not be initialized.
     */
    init: async function(sequelize: Sequelize): Promise<void>
    {

        // initialize the model
        initModel(sequelize);

        // create the tables if they don't exist yet
        try
        {
            await Pattern.sync({ force: true });
        }
        catch(error)
        {
            throw new RethrownError("Could not initialize the Pattern table.", error);
        }

        // add new patterns to the table
        const OVERVIEW_SHEET: Overview = await CommunitySpreadsheet.getOverview();
        let patterns: PatternAttributes[] = [];
        for (const ROW of OVERVIEW_SHEET)
        {
            patterns.push({
                name: ROW.name, 
                type: ROW.type,
                hatchTime: ROW.hatchTime == undefined ? null : ROW.hatchTime
            });
        }
        await Pattern.bulkCreate(patterns, { ignoreDuplicates: true } );
    }
}

export default PatternDal;