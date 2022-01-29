import { DataTypes, Model, Sequelize } from "sequelize";

interface UserAttributes
{
    discordId: string;
    name: string;
    spreadsheetId: string;
}

export class User extends Model<UserAttributes> implements UserAttributes
{
    public discordId!: string;
    public name!: string;
    public spreadsheetId!: string;
}

/**
 * Initializes the model and creates the table if it does not yet exist.
 * @param sequelize Database connection
 * @throws if the model could not be instantiated.
 */
export function initModel(sequelize: Sequelize): void
{
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
                allowNull: false
            }
        },
        { sequelize }
    );
}