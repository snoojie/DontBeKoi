const initModels = require("../../src/database/initModels").default;
const { dropAllTables, initSequelize, countRecords, select, selectOne, insert }
    = require("../_setup/database");
const { DataTypes } = require("sequelize");

// clear the database before and after all these tests
beforeAll(async() => await dropAllTables());
afterAll(async () => await dropAllTables());

// normally we would run the method to test, initModels, in each test directly
// but, google has a read quota
// so, let's run it in a before method where possible to limit how often it is done.

describe("Init models once for the following tests.", () => {

    beforeAll(async() => {
        await dropAllTables();

        let sequelize = initSequelize();
        await initModels(sequelize);
        sequelize.close();
    });

    afterAll(async() => await dropAllTables());

    // ============================
    // =====TABLES ARE CREATED=====
    // ============================

    testTableIsCreated("users");
    testTableIsCreated("patterns");
    testTableIsCreated("kois");
    function testTableIsCreated(name)
    {
        test(name + " table is created when it did not previously exist.", async() => {
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
            let sequelize = initSequelize();
            const COLUMNS = Object.keys(
                await sequelize.getQueryInterface().describeTable(tableName)
            );
            await sequelize.close();

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

    // ==================================
    // =====PATTERNS TABLE POPULATED=====
    // ==================================

    test("There are 30 progressive and at least 208 collector patterns.", async() => {
        const COUNT = await countRecords("patterns", "type='Progressive'");
        expect(COUNT).toBe(30);
    });

    test("There are at least 208 collector patterns.", async() => {
        const COUNT = await countRecords("patterns", "type='Collector'");
        expect(COUNT).toBeGreaterThanOrEqual(208);
    });

    // =============================
    // =====KOI TABLE POPULATED=====
    // =============================

    test("There are 32 times as many koi as patterns.", async() => {
        const PATTERN_COUNT = await countRecords("patterns");
        const KOI_COUNT = await countRecords("kois");
        expect(32 * PATTERN_COUNT).toBe(KOI_COUNT);
    });

    test("Pattern natsu has 32 koi.", async() => {
        const COUNT = await countRecords("kois", "pattern='Natsu'");
        expect(COUNT).toBe(32);
    });

    test("There are an equal number of common and rare koi.", async() => {
        const COMMON_COUNT = await countRecords("kois", "rarity='Common'");
        const RARE_COUNT = await countRecords("kois", "rarity='Rare'");
        expect(COMMON_COUNT).toBe(RARE_COUNT);
    });
});

// ====================================
// =====TABLES ARE NOT OVERWRITTEN=====
// ====================================

describe("Init models after prepoopulating tables.", () => {

    const USER = { name: "Name One", discord_id: "did1", spreadsheet_id: "sid1" };
    const PATTERN = { name: "somepattern", type: "sometype", hatch_time: 99 };
    const KOI = { name: "somekoi", pattern: PATTERN.name, rarity: "somerarity" };

    beforeAll(async() => {

        await dropAllTables();

        let sequelize = initSequelize();
        let queryInterface = sequelize.getQueryInterface();

        // populate users table
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

        // populate patterns table
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

        // populate kois table
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

        await sequelize.close();
    });

    afterAll(async() => await dropAllTables());

    test("Users are not overwritten.", async() => {
        const RECORD = await selectOne("users", `name='${USER.name}'`)
        expect(RECORD).toBeDefined();
        expect(RECORD.name).toBe(USER.name);
        expect(RECORD.discord_id).toBe(USER.discord_id);
        expect(RECORD.spreadsheet_id).toBe(USER.spreadsheet_id);
    }); 

    test("Patterns are not overwritten.", async() => {
        const RECORD = await selectOne("patterns", `name='${PATTERN.name}'`);
        expect(RECORD).toBeDefined();
        expect(RECORD.name).toBe(PATTERN.name);
        expect(RECORD.type).toBe(PATTERN.type);
        expect(RECORD.hatch_time).toBe(PATTERN.hatch_time);
    }); 

    test("Koi are not overwritten.", async() => {
        const RECORD = await selectOne("kois", `name='${KOI.name}'`);
        expect(RECORD).toBeDefined();
        expect(RECORD.name).toBe(KOI.name);
        expect(RECORD.pattern).toBe(KOI.pattern);
        expect(RECORD.rarity).toBe(KOI.rarity);
    }); 

});