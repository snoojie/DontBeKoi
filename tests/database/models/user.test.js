const { initModel, User } = require("../../../src/database/models/user");
const { initSequelize, dropAllTables, selectOne, getColumns } = require("../../_setup/database");

let sequelize;

beforeEach(async() => {
    await dropAllTables();
    
    // function to test
    sequelize = initSequelize();
    await initModel(sequelize);
    await sequelize.sync();
});

afterEach(async() => sequelize.close());

afterAll(async() => await dropAllTables());

describe("Database columns.", () => {
    let columns;
    beforeEach(async() => 
        columns = await getColumns("users")
    );

    // =======================
    // =====COLUMN EXISTS=====
    // =======================

    testColumnExists("discord_id");
    testColumnExists("name");
    testColumnExists("spreadsheet_id");
    testColumnExists("created_at");
    testColumnExists("updated_at");
    function testColumnExists(columnName)
    {
        test(`There exists ${columnName} column.`, () => {
            expect(columns[columnName]).toBeDefined();
        });
    }

    test("There are exactly 5 columns.", () => {
        expect(Object.keys(columns).length).toBe(5);
    });

    // ===========================
    // =====COLUMN ATTRIBUTES=====
    // ===========================

    test("Column discord_id is the primary key.", () => {
        expect(columns.discord_id.primaryKey).toBeTruthy();
    });

    testColumnCannotBeNull("discord_id");
    testColumnCannotBeNull("name");
    testColumnCannotBeNull("spreadsheet_id");
    function testColumnCannotBeNull(columnName)
    {
        test(`Column ${columnName} cannot be null.`, () => {
            expect(columns[columnName].allowNull).toBeFalsy();
        })
    }
    
});

// =========================
// =====PROPERTY EXISTS=====
// =========================

describe("Model properties.", () => {
    const USER_TO_SAVE = {
        discordId: "somediscord", 
        name: "somename", 
        spreadsheetId: "somespreadsheet"
    };
    let savedUser;
    beforeEach(async() => {
        await User.create(USER_TO_SAVE);
        savedUser = await User.findOne();
    });
    
    testPropertyExists("discordId");
    testPropertyExists("name");
    testPropertyExists("spreadsheetId");
    function testPropertyExists(propertyName)
    {
        test(`Property ${propertyName} exists.`, () => {
            expect(savedUser[propertyName]).toBe(USER_TO_SAVE[propertyName]);
        });
    }
});


// =============================
// =====PROPERTY ATTRIBUTES=====
// =============================

test("Property discordId cannot be null.", async() => {
    await expect(
        User.create({name: "some name", spreadsheetId: "some spreadsheet" })
    ).rejects.toThrow();
});

test("Property name cannot be null.", async() => {
    await expect(
        User.create({discordId: "some discord id", spreadsheetId: "some spreadsheet" })
    ).rejects.toThrow();
});

test("Property spreadsheetId cannot be null.", async() => {
    await expect(
        User.create({discordId: "some discordid", name: "some name" })
    ).rejects.toThrow();
});