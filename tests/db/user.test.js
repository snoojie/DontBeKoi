const { DataTypes, QueryTypes, Sequelize } = require("sequelize");
const UserDal = require("../../src/db/user").default;
const { dropAllTables, DATABASE_URL } = require("../_setup/db");

let sequelize;

// before a test runs, drop all tables
beforeEach(async() => {
    await dropAllTables();
    sequelize = new Sequelize(DATABASE_URL, { logging: false });
});

// after each test, close sequelize so the connection isn't hanging
afterEach(async() => {
    sequelize.close();
})

// after all tests have run, drop all tables
afterAll(async () => {
    await dropAllTables();
})

test("Initializing users will create Users table when it does not already exist.", async () => {
    await UserDal.init(sequelize);
    await expectUserTableExists();
});

describe("Create user table", () => {

    beforeEach(async() => {
        await createUserTable();
    });

    test("Initializing users will not create Users table when it already exists.", async () => {
        await UserDal.init(sequelize);
        await expectUserTableExists();
    });
    
    
    test("Initializing users will not destroy data in Users table.", async () => {
        
        // insert data into the table
        await sequelize.getQueryInterface().bulkInsert("Users", [{ name: "somename" }]);
    
        // function to test
        await UserDal.init(sequelize);
    
        // make sure Users did not change
        let users = await sequelize.query(
            'SELECT name FROM "Users"',
            { 
                type: QueryTypes.SELECT,
                raw: true 
            }
        );
        expect(users.length).toBe(1);
        expect(users[0].name).toBe("somename");
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

async function expectUserTableExists()
{
    let tables = await sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_name='Users'",
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
    let columns = Object.keys(await sequelize.getQueryInterface().describeTable("Users"))
    expect(columns).toContain(column);
}

async function createUserTable()
{
    await sequelize.getQueryInterface().createTable(
        "Users", { "name" : DataTypes.STRING }
    );
}