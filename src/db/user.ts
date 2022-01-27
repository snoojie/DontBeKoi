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
    },

    saveUser: async function(
        discordId: string, name: string, spreadsheetId: string
    ): Promise<void>
    {
        // if the user already exists in the database, 
        // update their name and spreadsheet ID
        let user: User | null;
        try {
            user = await User.findOne({ where: { discordId } });
        }
        catch(error)
        {
            throw new RethrownError(
                "Could not query User table by discord ID. " +
                "Could the table be set up incorrectly?",
                error
            );
        }
        if (user)
        {
            user.name = name;
            user.spreadsheetId = spreadsheetId;
        }

        // otherwise, create a new user
        else
        {
            user = User.build({ discordId, name, spreadsheetId });
        }

        // save the user in the database
        try
        {
            await user.save();
        }
        catch(error)
        {
            throw new RethrownError(
                `Could not save the user ` +
                `{ ` +
                    `discord ID: ${discordId}, ` +
                    `name: ${name}, ` +
                    `spreadsheet ID: ${spreadsheetId }` +
                `} ` +
                `in the database. Could the spreadsheet ID be a duplicate? `,
                error
            );
        }
    }
}

export default UserDal;