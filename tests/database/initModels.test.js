const initModels = require("../../src/database/initModels").default;
const { dropAllTables, initSequelize, countRecords, select, selectOne, insert }
    = require("../_setup/database");
const { DataTypes } = require("sequelize");

let sequelize;
let queryInterface;

// start each test with an empty database
beforeEach(async() => {
    await dropAllTables();
    sequelize = initSequelize();
    queryInterface = sequelize.getQueryInterface();
});
afterEach(async() => await sequelize.close());
afterAll(async () => await dropAllTables());

// ============================
// =====TABLES ARE CREATED=====
// ============================

testTableIsCreated("users");
testTableIsCreated("patterns");
testTableIsCreated("kois");
function testTableIsCreated(name)
{
    test(name + " table is created when it did not previously exist.", async() => {
        await initModels(sequelize);
        let tables = 
            await select("information_schema.tables", "table_name='" + name + "'");
        expect(tables.length).toBe(1);
    });
}

// =============================
// =====COLUMNS ARE CORRECT=====
// =============================

testTableHasColumns("users", ["discord_id", "name", "spreadsheet_id"]);
testTableHasColumns("patterns", ["name", "type", "hatch_time"]);
testTableHasColumns("kois", ["name", "id", "pattern", "rarity"]);
function testTableHasColumns(tableName, columnNames)
{
    test(`${tableName} table has columns ${columnNames.join(", ")}.`, async () => {
        await initModels(sequelize);
        const COLUMNS = Object.keys(await queryInterface.describeTable(tableName));

        // make sure each provided column is in the table
        for (const COLUMN_NAME of columnNames)
        {
            expect(COLUMNS).toContain(COLUMN_NAME);
        }

        // confirm the timestamp columns exist
        expect(COLUMNS).toContain("created_at");
        expect(COLUMNS).toContain("updated_at");

        // make sure no other columns are part of the table
        expect(COLUMNS.length).toBe(columnNames.length+2);
    });
}

// ====================================
// =====TABLES ARE NOT OVERWRITTEN=====
// ====================================

test("Users are not overwritten.", async() => {
    // populate table
    const USER = { name: "Name One", discord_id: "did1", spreadsheet_id: "sid1" };
    await queryInterface.createTable(
        "users", 
        { 
            "name" : DataTypes.STRING, 
            "discord_id": DataTypes.STRING, 
            "spreadsheet_id": DataTypes.STRING,
            "created_at" : DataTypes.STRING,
            "updated_at": DataTypes.STRING
        }
    );
    await insert("users", USER);

    // function to test
    await initModels(sequelize);

    // check that data was not overwritten
    const RECORD = await selectOne("users", `name='${USER.name}'`)
    expect(RECORD).toBeDefined();
    expect(RECORD.name).toBe(USER.name);
}); 

describe("Prepopulate patterns table.", () => {

    const PATTERN = { name: "somepattern" };

    beforeEach(async() => {
        await queryInterface.createTable(
            "patterns", 
            { 
                "name" : { type: DataTypes.STRING, primaryKey: true },
                "type": DataTypes.STRING, 
                "hatch_time": DataTypes.INTEGER,
                "created_at" : DataTypes.STRING,
                "updated_at": DataTypes.STRING
            }
        );
        await insert("patterns", PATTERN);
    });

    test("Patterns are not overwritten.", async() => {
        // function to test
        await initModels(sequelize);
    
        // check that data was not overwritten
        const RECORD = await selectOne("patterns", `name='${PATTERN.name}'`);
        expect(RECORD).toBeDefined();
        expect(RECORD.name).toBe(PATTERN.name);
    }); 

    test("Koi are not overwritten.", async() => {
        // populate koi table
        const KOI = { name: "somekoi", pattern: PATTERN.name };
        await queryInterface.createTable(
            "kois", 
            { 
                "id" : DataTypes.INTEGER,
                "name" : DataTypes.STRING,
                "rarity": DataTypes.STRING, 
                "pattern": DataTypes.STRING,
                "created_at" : DataTypes.STRING,
                "updated_at": DataTypes.STRING
            }
        );
        await insert("kois", KOI);

        // function to test
        await initModels(sequelize);
    
        // check that data was not overwritten
        const RECORD = await selectOne("kois", `name='${KOI.name}'`);
        expect(RECORD).toBeDefined();
        expect(RECORD.name).toBe(KOI.name);
        expect(RECORD.pattern).toBe(KOI.pattern);
    }); 
});

// ==================================
// =====PATTERNS TABLE POPULATED=====
// ==================================

test("There are 30 progressive patterns.", async() => {
    await initModels(sequelize);
    const COUNT = await countRecords(sequelize, "patterns", "type='Progressive'");
    expect(COUNT).toBe(30);
});

test("There are at least 208 collector patterns.", async() => {
    await initModels(sequelize);
    const COUNT = await countRecords(sequelize, "patterns", "type='Collector'");
    expect(COUNT).toBeGreaterThanOrEqual(208);
});

// =============================
// =====KOI TABLE POPULATED=====
// =============================

test("There are 32 times as many koi as patterns.", async() => {
    await initModels(sequelize);
    const PATTERN_COUNT = await countRecords(sequelize, "patterns");
    const KOI_COUNT = await countRecords(sequelize, "kois");
    expect(32 * PATTERN_COUNT).toBe(KOI_COUNT);
});

test("Pattern natsu has 32 koi.", async() => {
    await initModels(sequelize);
    const COUNT = await countRecords(sequelize, "kois", "pattern='Natsu'");
    expect(COUNT).toBe(32);
});

test("There are an equal number of common and rare koi.", async() => {
    await initModels(sequelize);
    const COMMON_COUNT = await countRecords(sequelize, "kois", "rarity='Common'");
    const RARE_COUNT = await countRecords(sequelize, "kois", "rarity='Rare'");
    expect(COMMON_COUNT).toBe(RARE_COUNT);
});