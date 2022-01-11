import { DataTypes, Model } from "sequelize";
import sequelize from "./sequelize";

interface UserAttributes
{
    discordId: string;
    spreadsheetId: string;
}

export class User extends Model<UserAttributes> implements UserAttributes
{
    public discordId!: string;
    public spreadsheetId!: string;

    public static async setSpreadsheet(discordId: string, spreadsheetId: string): Promise<User | undefined>
    {
        // confirm no one else has this spreadsheet
        if (await User.findOne({ where: { spreadsheetId }}))
        {
            return;
        }

        // see if this user is already in the database
        let user: User | null = await User.findOne({
            where: { discordId }
        });

        if (user)
        {
            // user already exists, so update their spreadsheet ID
            user.spreadsheetId = spreadsheetId;
        }

        else
        {
            // user is not yet in database, so create a new user
            user = User.build({ discordId, spreadsheetId });
        }

        // save the user in the database
        return user.save();
    }
}

export async function initUser()
{
    User.init(
        {
            discordId: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true
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

    // create User table if it doesn't exist
    await User.sync();
}