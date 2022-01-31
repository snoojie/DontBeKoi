import { Association, DataTypes, FindOptions, Model, Op, Sequelize } from "sequelize";
import { PatternType } from "../../types";
import { Koi } from "./koi";

export interface PatternAttributes
{
    name: string;
    type: PatternType;
    hatchTime: number | null;
}

export class Pattern extends Model<PatternAttributes> implements PatternAttributes
{
    declare name: string;
    declare type: PatternType;
    declare hatchTime: number | null;

    declare readonly kois?: Koi[];
  
    declare static associations: {
      kois: Association<Pattern, Koi>;
    };

    public static async findByCaseInsensitiveName(
        name: string, includeKois: boolean
    ): Promise<Pattern | null>
    {
        let options: FindOptions<PatternAttributes> = { where: { name: { [Op.iLike]: name } } };
        if (includeKois)
        {
            options.include = [ Pattern.associations.kois ];
        }
        return Pattern.findOne(options);
    }
}

/**
 * Initializes the model and creates the table if it does not yet exist.
 * @param sequelize Database connection
 * @throws if the model could not be instantiated.
 */
export function initModel(sequelize: Sequelize): void
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