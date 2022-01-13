import axios, { AxiosResponse } from "axios";
import cheerio, { CheerioAPI } from "cheerio";
import { DataTypes, Model } from "sequelize";
import { KoiCommunitySpreadsheet } from "../google/koiCommunitySpreadsheet";
import { Color, Type, PatternAttributes } from "../koiInterfaces";
import { Rarity } from "../structures/command/koiCommand";
import sequelize from "./sequelize";

export interface Koi
{
    rarity: Rarity;
}

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

    public static async getKoi(patternName: string, colorName: string): Promise<Koi>
    {
        // get the pattern
        const PATTERN: Pattern | null = await Pattern.findOne({
            where: {
                name: capitalizeFirstLetter(patternName)
            }
        });
        if (!PATTERN)
        {
            throw new Error(`Pattern ${patternName} does not exist.`);
        }
        
        // find the rarity of this koi
        colorName = colorName.toLowerCase();
        let rarity: Rarity | undefined;
        for (const BASE_COLOR of PATTERN.baseColors)
        {
            if (colorName.startsWith(BASE_COLOR.name.toLowerCase()))
            {
                // found the base color!
                // now to find the highlight color to determine rarity

                rarity = _isRarity(colorName, BASE_COLOR, PATTERN.commonColors, Rarity.Common) ? Rarity.Common :
                        _isRarity(colorName, BASE_COLOR, PATTERN.rareColors, Rarity.Rare) ? Rarity.Rare : undefined;
            }
        }
        if (!rarity)
        {
            throw new Error(`Pattern ${patternName} does not have color ${colorName}.`);
        }

        return {
            rarity
        };
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

function _isRarity(colorToFind: string, baseColor: Color, highlightColors: Color[], rarity: Rarity): boolean
{
    for (const HIGHLIGHT_COLOR of highlightColors)
    {
        if (colorToFind == (baseColor.name + HIGHLIGHT_COLOR.name).toLowerCase())
        {
            // found the highlight color!
            return true;
        }
    }

    // could not find koi
    return false;
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