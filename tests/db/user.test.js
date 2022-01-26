const { DataTypes, QueryTypes, Sequelize } = require("sequelize");
const UserDal = require("../../src/db/user").default;
const { dropAllTables, initSequelize } = require("../_setup/db");

let sequelize;

// Start every test with no user table in the database.
// Drop the user table after the last test.
// Start a sequelize connection to be used before each test,
// and close that connection after each test.
beforeEach(async() => {
    await dropAllTables();
    sequelize = initSequelize();
});
afterEach(async() => await sequelize.close());
afterAll(async () => await dropAllTables());

// ===================
// =====test init=====
// ===================

test("Initializing users creates Users table when it did not exist prior.", async () => {
    await UserDal.init(sequelize);
    await expectUserTableExists();
});

describe("Create user table beforehand.", () => {

    // Start each test with a User table with sample data
    beforeEach(async() => {
        let queryInterface = sequelize.getQueryInterface();
        await queryInterface.createTable(
            "users", 
            { 
                "name" : DataTypes.STRING, 
                "discord_id": DataTypes.STRING, 
                "spreadsheet_id": DataTypes.STRING
            }
        );
        await queryInterface.bulkInsert("users", [{ name: "Name One" }]);
    });

    test("Can initialize users when the table already exists.", async () => {
        await UserDal.init(sequelize);
        await expectUserTableExists();
    });

    test("Initializing users will not destroy data preexisting in the users table.", async () => {
        await UserDal.init(sequelize);

        // check users did not change
        let users = await getUsers();
        expect(users.length).toBe(1);
        expect(users[0].name).toBe("Name One");
    });
});

async function expectUserTableExists()
{
    let tables = await sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_name='users'",
        { 
            type: QueryTypes.SELECT, 
            plain: true,
            raw: true 
        }
    );
    expect(tables.length).toBe(1);
}

testColumnExists("name");
testColumnExists("discord_id");
testColumnExists("spreadsheet_id");

// helper functions for init

function testColumnExists(column)
{
    test(`Initializing a new users table creates a ${column} column.`, async () => {
        await UserDal.init(sequelize);        
        let columns = Object.keys(
            await sequelize.getQueryInterface().describeTable("users")
        );
        expect(columns).toContain(column);
    });
}

// ======================
// =====test addUser=====
// ======================

describe("Initialize UserDal beforehand.", () => {
    
    beforeEach(async() => await UserDal.init(sequelize));

    test("Can add a new record to an empty user table", async () => {
        await UserDal.setUser("some discord id", "Some Name", "some spreadsheet ID");
        let users = await getUsers();
        expect(users.length).toBe(1);
    });

    testAddingNewUserSavesField("name");
    testAddingNewUserSavesField("discord ID");
    testAddingNewUserSavesField("spreadsheet ID");
});

// helper functions for setUser

function testAddingNewUserSavesField(readableColumn)
{
    // change readableColumn to what is shown in the database
    // ex discord ID -> discord_id
    let column = readableColumn.toLowerCase().replace(" ", "_");

    let data = {
        discord_id: "some discord id",
        name: "Some Name",
        spreadsheet_id: "some spreadsheet ID"
    };

    test(`Adding a new user saves their ${readableColumn} in the user table.`, async () => {
        await UserDal.setUser(data.discord_id, data.name, data.spreadsheet_id);
        let users = await getUsers();
        expect(users[0][column]).toBe(data[column]);
    });
}

// ==========================
// =====helper functions=====
// ==========================

async function getUsers()
{
    let users = await sequelize.query(
        "SELECT name, discord_id, spreadsheet_id FROM users",
        { 
            type: QueryTypes.SELECT,
            raw: true 
        }
    );
    return users;
}