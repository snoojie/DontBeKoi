import { Sequelize } from "sequelize";
import RethrownError from "../../util/rethrownError";
import { Pattern, initModel } from "../models/pattern";

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
    }
}

export default PatternDal;