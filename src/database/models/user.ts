import { DataTypes, Model, type Sequelize } from "sequelize";

/**
 * Columns of the User table in the database.
 */
interface UserAttributes
{
    discordId: string;
    name: string;
    spreadsheetId: string;
}

/**
 * Represents a single record from the User table in the database.
 */
export class User extends Model<UserAttributes> implements UserAttributes
{
    declare discordId: string;
    declare name: string;
    declare spreadsheetId: string;
}

/**
 * Initializes the model and creates the table if it does not yet exist.
 * @param sequelize Database connection
 */
export function initUser(sequelize: Sequelize): void
{
    User.init(
        {
            discordId: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                primaryKey: true
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