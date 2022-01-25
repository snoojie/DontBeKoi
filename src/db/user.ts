import { DataTypes, Model, Sequelize } from "sequelize";
import RethrownError from "../util/rethrownError";

interface UserAttributes
{
    discordId: string;
    name: string;
    spreadsheetId: string;
}

class User extends Model<UserAttributes> implements UserAttributes
{
    public discordId!: string;
    public name!: string;
    public spreadsheetId!: string;
}

const UserDal = {
    
    /**
     * Initializes the User table.
     * @param sequelize Database connection
     * @throws if the User table could not be initialized.
     */
    init: async function(sequelize: Sequelize): Promise<void>
    {

        // initialize the model
        User.init(
            {
                discordId: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    unique: true
                },
                name: {
                    type: DataTypes.STRING,
                    allowNull: false
                },
                spreadsheetId: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    unique: true
                }
            },
            {
                sequelize
            }
        );

        // create the table if it doesn't exist yet
        try
        {
            await User.sync()
        }
        catch(error)
        {
            throw new RethrownError("Could not initialize the User table.", error);
        }
    }
}

export default UserDal;