const initModels = require("../../src/database/initModels").default;
const { dropAllTables, initSequelize } = require("../_setup/database");
const { DataTypes, QueryTypes } = require("sequelize");

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
        let tables = await sequelize.query(
            "SELECT table_name FROM information_schema.tables " + 
            "WHERE table_name='" + name + "'",
            { type: QueryTypes.SELECT, raw: true }
        );
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

        // make sure no other columns are part of the table
        expect(COLUMNS.length).toBe(columnNames.length);
    });
}


// ====================================
// =====TABLES ARE NOT OVERWRITTEN=====
// ====================================

test("Users are not overwritten.", async() => {
    // populate table
    const USER = { name: "Name One" };
    await queryInterface.createTable(
        "users", 
        { 
            "name" : DataTypes.STRING, 
            "discord_id": DataTypes.STRING, 
            "spreadsheet_id": DataTypes.STRING
        }
    );
    await queryInterface.bulkInsert("users", [USER]);

    // function to test
    await initModels(sequelize);

    // check that data was not overwritten
    const RECORD = await sequelize.query(
        `SELECT name FROM users WHERE name='${USER.name}'`,
        { type: QueryTypes.SELECT, raw: true, plain: true }
    );
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
                "hatch_time": DataTypes.INTEGER
            }
        );
        await queryInterface.bulkInsert("patterns", [PATTERN]);
    });

    test("Patterns are not overwritten.", async() => {
        // function to test
        await initModels(sequelize);
    
        // check that data was not overwritten
        const RECORD = await sequelize.query(
            `SELECT name FROM patterns WHERE name='${PATTERN.name}'`,
            { type: QueryTypes.SELECT, raw: true, plain: true }
        );
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
                "pattern": DataTypes.STRING
            }
        );
        await queryInterface.bulkInsert(
            "kois", [KOI]
        );

        // function to test
        await initModels(sequelize);
    
        // check that data was not overwritten
        const RECORD = await sequelize.query(
            `SELECT name, pattern FROM kois WHERE name='${KOI.name}'`,
            { type: QueryTypes.SELECT, raw: true, plain: true }
        );
        expect(RECORD).toBeDefined();
        expect(RECORD.name).toBe(KOI.name);
        expect(RECORD.pattern).toBe(KOI.pattern);
    }); 
});
