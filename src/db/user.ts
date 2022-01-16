import { DataTypes, Model } from "sequelize";
import { UserKoiSpreadsheet } from "../google/userKoiSpreadsheet";
import sequelize from "./sequelize";

async function getSpreadsheet(spreadsheetId: string): Promise<UserKoiSpreadsheet>
{
    const SPREADSHEET: UserKoiSpreadsheet = new UserKoiSpreadsheet();
    await SPREADSHEET.connect(spreadsheetId);
    return SPREADSHEET;
}

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

    public static async setSpreadsheet(
        discordId: string, name: string, spreadsheetId: string): Promise<User>
    {
        // confirm this spreadsheet is valid
        try 
        {
            await getSpreadsheet(spreadsheetId);
        }
        catch(error)
        {
            throw new Error(
                `Spreadsheet ID ${spreadsheetId} is not valid. Consider sample spreadsheet ` + 
                `<https://docs.google.com/spreadsheets/d/1cUG1W7nqyLyZyeXRp_OH9Q-rIjjLTaSdftedK56-4U0> ` +
                `which has ID of 1cUG1W7nqyLyZyeXRp_OH9Q-rIjjLTaSdftedK56-4U0`
            );
        }

        // confirm no one else has this spreadsheet
        let user: User | null = await User.findOne({ where: { spreadsheetId }});
        if (user)
        {
            throw new Error(`User ${user.name} is already using spreadsheet ${spreadsheetId}`);
        }

        // see if this user is already in the database
        user = await User.findOne({
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
            user = User.build({ discordId, name, spreadsheetId });
        }

        // save the user in the database
        return user.save();
    }

    public async isMissingKoi(patternName: string, colorName: string): Promise<boolean>
    {
        const SPREADSHEET: UserKoiSpreadsheet = new UserKoiSpreadsheet();

        try
        {
            await SPREADSHEET.connect(this.spreadsheetId);
        }
        catch (error) 
        {
            throw new Error(`Cannot read from ${this.name}'s spreadsheet ${this.spreadsheetId}`);
        }
        
        return SPREADSHEET.isMissingKoi(patternName, colorName);
    }

    public static async whoIsMissingKoi(patternName: string, colorName: string): Promise<User[]>
    {
        let usersMissingKoi: User[] = [];

        const USERS: User[] = await User.findAll();
        for (const USER of USERS)
        {
            if (await USER.isMissingKoi(patternName, colorName))
            {
                usersMissingKoi.push(USER);
            }
        }

        return usersMissingKoi;
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

    // create User table if it doesn't exist
    await User.sync();

    // drop and recreate User table
    //await User.sync({force: true});
}