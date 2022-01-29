import { DataTypes, Model, Sequelize } from "sequelize";
import RethrownError from "../util/rethrownError";

interface PatternAttributes
{
    name: string;
    hatchTime: number;
    type: "Progressive" | "Collector";
}

class Pattern extends Model<PatternAttributes> implements PatternAttributes
{
    public name!: string;
    public hatchTime!: number;
    public type!: "Progressive" | "Collector";
}

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
        Pattern.init(
            {
                name: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    unique: true
                },
                hatchTime: {
                    type: DataTypes.INTEGER,
                    allowNull: true
                },
                type: {
                    type: DataTypes.STRING,
                    allowNull: false
                }
            },
            { sequelize }
        );

        // create the table if it doesn't exist yet
        try
        {
            await Pattern.sync()
        }
        catch(error)
        {
            throw new RethrownError("Could not initialize the Pattern table.", error);
        }
    },
}

export default PatternDal;