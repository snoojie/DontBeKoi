import { Sequelize } from "sequelize";
import { CommunitySpreadsheet, Overview } from "../../google/communitySpreadsheet";
import RethrownError from "../../util/rethrownError";
import { Pattern, initModel, Type } from "../models/pattern";

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

        // create the table if it doesn't exist yet
        try
        {
            await Pattern.sync()
        }
        catch(error)
        {
            throw new RethrownError("Could not initialize the Pattern table.", error);
        }

        // populate table with collector patterns
        const OVERVIEW_SHEET: Overview = await CommunitySpreadsheet.getOverview();

        for (const ROW of OVERVIEW_SHEET)
        {
            //console.log(ROW);
            await Pattern.create({
                name: ROW.name, 
                type: Type.Collector, 
                hatchTime: ROW.hatchTime
            });
        }

    }
}

export default PatternDal;