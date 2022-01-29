import { DataTypes, Model, Sequelize } from "sequelize";

enum Type
{
    Progressive,
    Collector
}

interface PatternAttributes
{
    name: string;
    hatchTime: number;
    type: Type;
}

export class Pattern extends Model<PatternAttributes> implements PatternAttributes
{
    public name!: string;
    public hatchTime!: number;
    public type!: Type;
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
                unique: true
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