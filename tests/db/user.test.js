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

describe("Create user table before test.", () => {

    // Start each test with a User table with sample data
    beforeEach(async() => await createUserTable());

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

test("Users table has a name column.", async () => {
    await UserDal.init(sequelize);
    await expectUserTableHasColumn("name");
});

test("Users table has a discord ID column.", async () => {
    await UserDal.init(sequelize);
    await expectUserTableHasColumn("discordid");
});

test("Users table has a spreadsheet ID column.", async () => {
    await UserDal.init(sequelize);
    await expectUserTableHasColumn("spreadsheetid");
});

// =============================
// =====test setSpreadsheet=====
// =============================

test("Create new user record when setting spreadsheet and User table is empty.", async() => {
    await UserDal.init(sequelize);
    await UserDal.setSpreadsheet("someId", "Some Name", "someSpreadsheet");
    let users = await getUsers();
    expect(users.length).toBe(1);
    let user = users[0];
    console.log(user);
    expect(user.name).toBe("Some Name");
    expect(user.discordid).toBe("someId");
    expect(user.spreadsheetid).toBe("someSpreadsheet");
});

// ==========================
// =====helper functions=====
// ==========================

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

async function expectUserTableHasColumn(column)
{
    let columns = Object.keys(await sequelize.getQueryInterface().describeTable("users"))
    expect(columns).toContain(column);
}

async function createUserTable()
{
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.createTable(
        "Users", 
        { 
            "name" : DataTypes.STRING,
            "discordId": DataTypes.STRING,
            "spreadsheetId": DataTypes.STRING
        }
    );
    await queryInterface.bulkInsert(
        "Users", 
        [ { name: "Name One", discordId: "id1", spreadsheetId: "spreadsheet1" } ]
    );
}

async function getUsers()
{
    let users = await sequelize.query(
        "SELECT name, discordId, spreadsheetId FROM Users",
        { 
            type: QueryTypes.SELECT,
            raw: true 
        }
    );
    return users;
}/*

async function addUser(name, discordId, spreadsheetId)
{
    await sequelize.getQueryInterface().bulkInsert("Users", [{ name, discordId, spreadsheetId }]);
}*/