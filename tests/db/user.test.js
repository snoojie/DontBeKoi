const { DataTypes, QueryTypes, Sequelize } = require("sequelize");
const UserDal = require("../../src/db/user").default;
const { dropAllTables, DATABASE_URL } = require("../_setup/db");

let sequelize;

// before a test runs, drop all tables and initialize sequelize to be used in tests
beforeEach(async() => {
    await dropAllTables();
    sequelize = new Sequelize(
        DATABASE_URL, 
        { 
            logging: false, 
            quoteIdentifiers: false 
        }
    );
});

// after each test, close sequelize so the connection isn't hanging
afterEach(async() => await sequelize.close());

// after all tests have run, drop all tables
//afterAll(async () => await dropAllTables());


// ===================
// =====test init=====
// ===================

test("Initializing users will create Users table when it does not already exist.", async () => {
    await UserDal.init(sequelize);
    await expectUserTableExists();
});

describe("Create user table", () => {

    beforeEach(async() => await createUserTable());

    test("Initializing users will not create Users table when it already exists.", async () => {
        await UserDal.init(sequelize);
        await expectUserTableExists();
    });
    
    test("Initializing users will not destroy data in Users table.", async () => {
        // function to test
        await UserDal.init(sequelize);
    
        // make sure Users did not change
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
    await expectUserTableHasColumn("discordId");
});

test("Users table has a spreadsheet ID column.", async () => {
    await UserDal.init(sequelize);
    await expectUserTableHasColumn("spreadsheetId");
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
    expect(columns).toContain(column.toLowerCase());
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