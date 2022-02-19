import { Association, DataTypes, Model, Sequelize } from "sequelize";
import { PatternType } from "../../types";
import { Koi } from "./koi";

/**
 * Columns of the Pattern table in the database.
 */
export interface PatternAttributes
{
    name: string;
    type: PatternType;
    hatchTime: number | null;
}

/**
 * Represents a single record from the Pattern table in the database.
 */
export class Pattern extends Model<PatternAttributes> implements PatternAttributes
{
    declare name: string;
    declare type: PatternType;
    declare hatchTime: number | null;

    declare readonly kois?: Koi[];
  
    declare static associations: {
      kois: Association<Pattern, Koi>;
    };
}

/**
 * Initializes the model and creates the table if it does not yet exist.
 * @param sequelize Database connection
 */
export function initPattern(sequelize: Sequelize): void
{
    Pattern.init(
        {
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                primaryKey: true
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
}