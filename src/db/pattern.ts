import { DataTypes, Model } from "sequelize";
import { KoiCommunitySpreadsheet } from "../google/koiCommunitySpreadsheet";
import { Color, Type, PatternAttributes } from "../koiInterfaces";
import sequelize from "./sequelize";

export class Pattern extends Model<PatternAttributes> implements PatternAttributes
{
    public name!: string;   // null assertion ! is required in strict mode
    public hatchTime!: number | null;
    public baseColors!: Color[];
    public commonColors!: Color[];
    public rareColors!: Color[];
    public type!: Type;

    public static async getCollector(name: string): Promise<Pattern | undefined>
    {
        const PATTERN: Pattern | null = await Pattern.findOne({
            where: {
                name: capitalizeFirstLetter(name),
                type: Type.Collector
            }
        });
        if (!PATTERN)
        {
            return undefined;
        }
        return PATTERN;
    }
}

export async function initPattern()
{
    Pattern.init(
        {
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true
            },
            hatchTime: {
                type: DataTypes.DECIMAL,
                allowNull: true // difficult to get hatch time of progressives
            },
            baseColors: {
                type: DataTypes.JSON,
                allowNull: false
            },
            commonColors: {
                type: DataTypes.JSON,
                allowNull: false
            },
            rareColors: {
                type: DataTypes.JSON,
                allowNull: false
            },
            type: {
                type: DataTypes.ENUM,
                values: ["progressive", "collector"],
                allowNull: false
            }
        },
        {
            sequelize
        }
    );

    // remove the pattern table
    await Pattern.sync({ force: true });

    populatePatterns();
}

function capitalizeFirstLetter(text: string): string
{
    if (text.length == 0)
    {
        return "";
    }
    let formattedText = text[0].toUpperCase();
    if (text.length > 1)
    {
        formattedText += text.substring(1).toLowerCase();
    }
    return formattedText;
}

async function populatePatterns(): Promise<void>
{
    //https://docs.google.com/spreadsheets/d/1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo
    let koiCommunitySpreadsheet: KoiCommunitySpreadsheet = new KoiCommunitySpreadsheet();
    await koiCommunitySpreadsheet.connect("1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo");

    const PATTERNS: PatternAttributes[] = koiCommunitySpreadsheet.getPatternsAttributes();

    // save the patterns in the db
    await Pattern.bulkCreate(PATTERNS, { validate: true });
}