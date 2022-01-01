import { DataTypes, Model, Sequelize } from "sequelize";
import { Google, Sheet, SheetRow, Spreadsheet } from "../google";

require("dotenv").config(); // only needed for testing

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

enum Type {
    Progressive = "progressive",
    Collector = "collector"
}

interface PatternAttributes
{
    name: string;
    hatchTime?: number | null;
    baseColors: Color[];
    commonColors: Color[];
    rareColors: Color[];
    type: Type;
}

class Pattern extends Model<PatternAttributes> implements PatternAttributes
{
    public name!: string;   // null assertion ! is required in strict mode
    public hatchTime!: number | null;
    public baseColors!: Color[];
    public commonColors!: Color[];
    public rareColors!: Color[];
    public type!: Type;
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

async function setup()
{
    // drop table and recreate it
    //await Pattern.sync({ force: true });
    await sequelize.sync({ force: true });

    try {
        populatePatterns();
    }
    catch (error) {
        console.error(error);
    }
}

async function populatePatterns(): Promise<void>
{
    //https://docs.google.com/spreadsheets/d/1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo
    let google: Google = Google.getInstance();

    // get google sheets
    const SHEETS: Sheet[] = await google.getSheets(
        "1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo",
        ["Progressives!I2:AN70", "A-M: Collectors!B2:K"]
    );

    let patterns: PatternAttributes[] = [];

    // get the progressive patterns
    patterns.push(...getPatterns(
        google, 
        google.getSheetRows(SHEETS[0]), // rows in the progressive sheet
        Type.Progressive
    ));

    // get the collector patterns
    patterns.push(...getPatterns(
        google, 
        google.getSheetRows(SHEETS[1]), // rows in the collector sheet
        Type.Collector
    ));

    // save the progressive patterns in the db
    await Pattern.bulkCreate(patterns, { validate: true });
    console.log("Done!");
}

setup();

function getPatterns(google: Google, rows: SheetRow[], type: Type): PatternAttributes[]
{
    let patterns: PatternAttributes[] = [];

    for (let i=0; i+5<rows.length; i+=7)
    {
        // every 7 rows represents a pattern

        const PATTERN_ROWS = rows.slice(i, i+6);

        // progressive sheet has a pattern every 11 columns per row
        // collector sheet has only 1 pattern per row
        const PATTERNS_PER_ROW = type == Type.Progressive ? 3 : 1;
        for (let j=0; j<PATTERNS_PER_ROW; j++)
        {
            patterns.push(getPattern(google, PATTERN_ROWS, j*11, type));
        }
    }

    return patterns;
}

function getPattern(google: Google, rows: SheetRow[], columnIndex: number, type: Type): PatternAttributes
{
    // first row is the pattern name
    // the next row has the highlight colors for common and rare
    // the next 4 rows has the base colors
    
    // get pattern name
    const NAME: string = google.getCellText(rows[0], columnIndex);

    // get common and rare highlight colors
    let commonColors: Color[] = [];
    let rareColors: Color[] = [];
    const HIGHLIGHT_COLORS_ROW: SheetRow = rows[1];
    for (let j=1; j<5; j++)
    {
        commonColors.push(getColor(google, HIGHLIGHT_COLORS_ROW, j+columnIndex));
        rareColors.push(getColor(google, HIGHLIGHT_COLORS_ROW, j+5+columnIndex));
    }

    // get base colors
    let baseColors: Color[] = [];
    for (let j=0; j<4; j++)
    {
        baseColors.push(getColor(
            google, 
            rows[2+j], 
            0+columnIndex
        ));
    }

    return {
        name: NAME,
        baseColors: baseColors,
        commonColors: commonColors,
        rareColors: rareColors,
        type: type
    };
}

function getColor(google: Google, row: SheetRow, columnIndex: number): Color
{
    // get the name
    // note that on the google sheet,
    // prefixes generally end with a dash like "Ku-",
    // and suffixes generally start with a dash like "-shiro"
    // however sometimes there is no dash at all
    let name = google.getCellText(row, columnIndex);
    if (name.startsWith("-"))
    {
        name = name.substring(1);
    }
    else if (name.endsWith("-"))
    {
        name = name.slice(0, -1);
    }

    return {
        name: name,
        hex: google.getCellBackgroundColor(row, columnIndex)
    }
}