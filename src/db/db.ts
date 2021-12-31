import { DataTypes, Model, Sequelize } from "sequelize";

// connect to database
const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "./dontbekoi.db",
    logging: false
});

interface Color {
    name: string;
    hex: string;
}

interface PatternAttributes
{
    name: string;
    hatchTime: number;
    baseColors: Color[];
    commonColors: Color[];
    rareColors: Color[];
}

class Pattern extends Model<PatternAttributes> implements PatternAttributes
{
    public name!: string;   // null assertion ! is required in strict mode
    public hatchTime!: number;
    public baseColors!: Color[];
    public commonColors!: Color[];
    public rareColors!: Color[];
}

Pattern.init(
    {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        hatchTime: {
            type: DataTypes.DECIMAL,
            allowNull: false
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
        }
    },
    {
        sequelize
    }
);

async function setup()
{
    // drop table and recreate it
    //await Pattern.sync({ force: true });
    await sequelize.sync({ force: true });

    // test data
    await Pattern.create({ 
        name: "Usagi", 
        hatchTime: 5, 
        baseColors: [{ name: "bluee", hex: "" }],
        commonColors: [{ name: "bluee", hex: "" }],
        rareColors: [{ name: "bluee", hex: "" }]
    });
    
    // view all patterns
    const patterns = await Pattern.findAll();
    console.log("All patterns:", JSON.stringify(patterns, null, 2));
}

setup();