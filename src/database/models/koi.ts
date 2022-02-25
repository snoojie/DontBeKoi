import { DataTypes, Model, type Association, type Sequelize } from "sequelize";
import type { Rarity } from "../../types";
import EnhancedError from "../../util/enhancedError";
import { Pattern } from "./pattern";

/**
 * Error thrown when Koi model initialization fails.
 */
export class KoiModelError extends EnhancedError {}

/**
 * Columns of the Koi table in the database.
 */
export interface KoiAttributes
{
    name: string;
    rarity: Rarity;
    patternName: string;
}

/**
 * Represents a single record from the Koi table in the database.
 */
export class Koi extends Model<KoiAttributes> implements KoiAttributes
{
    declare name: string;
    declare rarity: Rarity;
    declare patternName: string;

    declare readonly pattern?: Pattern;
    declare static associations: {
        pattern: Association<Koi, Pattern>;
    };
}

/**
 * Initializes the model and creates the table if it does not yet exist.
 * @param sequelize Database connection
 * @throws KoiModelError if initialization fails.
 */
export function initKoi(sequelize: Sequelize): void
{
    Koi.init(
        {
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: "compositeIndex"
            },
            rarity: {
                type: DataTypes.STRING,
                allowNull: false
            },
            patternName: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: "compositeIndex"
            }
        },
        { sequelize }
    );

    try
    {
        Pattern.hasMany(Koi, {
            sourceKey: "name",
            foreignKey: "patternName",
            as: "kois"
        });
    }
    catch(error)
    {
        throw new KoiModelError("Could not associate Pattern to Koi. " +
            "Did you forget to inititalize Pattern before initializing Koi?",
            error
        );
    }

    Koi.belongsTo(Pattern, {
        foreignKey: "patternName",
        targetKey: "name",
        as: "pattern"
    });
}