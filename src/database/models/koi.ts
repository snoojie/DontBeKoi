import { DataTypes, Model, Sequelize } from "sequelize";
import { Rarity } from "../../types";

export interface KoiAttributes
{
    name: string;
    rarity: Rarity;
    patternName: string;
}

export class Koi extends Model<KoiAttributes> implements KoiAttributes
{
    declare name: string;
    declare rarity: Rarity;
    declare patternName: string;
}

/**
 * Initializes the model and creates the table if it does not yet exist.
 * @param sequelize Database connection
 * @throws if the model could not be instantiated.
 */
export function initModel(sequelize: Sequelize): void
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
}