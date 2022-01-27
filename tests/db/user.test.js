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
    const TABLES = await sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_name='users'",
        { 
            type: QueryTypes.SELECT, 
            plain: true,
            raw: true 
        }
    );
    expect(TABLES.length).toBe(1);
}

testColumnExists("name");
testColumnExists("discord_id");
testColumnExists("spreadsheet_id");
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

describe("Initialize users beforehand.", () => {

    const FIRST_DISCORD_ID = "first discord id";
    const FIRST_NAME = "One Name";
    const FIRST_SPREADSHEET_ID = "1 spreadsheet ID";

    const SECOND_DISCORD_ID = "SEcond discord id";
    const SECOND_NAME = "secondname";
    const SECOND_SPREADSHEET_ID = "twospreadsheets";
    
    beforeEach(async() => await UserDal.init(sequelize));

    test("Can add a new user.", async () => {
        await UserDal.setUser(FIRST_DISCORD_ID, FIRST_NAME, FIRST_SPREADSHEET_ID);
        let users = await getUsers();
        expect(users.length).toBe(1);
        expect(users[0].discord_id).toBe(FIRST_DISCORD_ID);
        expect(users[0].name).toBe(FIRST_NAME);
        expect(users[0].spreadsheet_id).toBe(FIRST_SPREADSHEET_ID);
    });

    test("Can add several new users.", async () => {
        await UserDal.setUser(FIRST_DISCORD_ID, FIRST_NAME, FIRST_SPREADSHEET_ID)
        await UserDal.setUser(SECOND_DISCORD_ID, SECOND_NAME, SECOND_SPREADSHEET_ID);

        let users = await getUsers();
        expect(users.length).toBe(2);

        let firstUser = users[0];
        let secondUser = users[1];

        expect(firstUser.discord_id).toBe(FIRST_DISCORD_ID);
        expect(firstUser.name).toBe(FIRST_NAME);
        expect(firstUser.spreadsheet_id).toBe(FIRST_SPREADSHEET_ID);

        expect(secondUser.discord_id).toBe(SECOND_DISCORD_ID);
        expect(secondUser.name).toBe(SECOND_NAME);
        expect(secondUser.spreadsheet_id).toBe(SECOND_SPREADSHEET_ID);
    });

    describe("Load a user in the user table.", () => {

        beforeEach(async() => 
            await UserDal.setUser(FIRST_DISCORD_ID, FIRST_NAME, FIRST_SPREADSHEET_ID)
        );

        test("Can update a user's name.", async () => {
            await UserDal.setUser(FIRST_DISCORD_ID, "New Name", FIRST_SPREADSHEET_ID);
            let users = await getUsers();
            expect(users.length).toBe(1);
            expect(users[0].name).toBe("New Name");
            expect(users[0].discord_id).toBe(FIRST_DISCORD_ID);
            expect(users[0].spreadsheet_id).toBe(FIRST_SPREADSHEET_ID);
        });

        test("Can update a user's spreadsheet ID.", async () => {
            await UserDal.setUser(FIRST_DISCORD_ID, FIRST_NAME, "new spreadsheet ID");
            let users = await getUsers();
            expect(users.length).toBe(1);
            expect(users[0].name).toBe(FIRST_NAME);
            expect(users[0].discord_id).toBe(FIRST_DISCORD_ID);
            expect(users[0].spreadsheet_id).toBe("new spreadsheet ID");
        });

        test("Can update both a user's name and spreadsheet ID.", async () => {
            await UserDal.setUser(FIRST_DISCORD_ID, "New Name", "new spreadsheet ID");
            let users = await getUsers();
            expect(users.length).toBe(1);
            expect(users[0].name).toBe("New Name");
            expect(users[0].discord_id).toBe(FIRST_DISCORD_ID);
            expect(users[0].spreadsheet_id).toBe("new spreadsheet ID");
        });

        test("Can add two users with the same name.", async () => {
            await UserDal.setUser(SECOND_DISCORD_ID, FIRST_NAME, SECOND_SPREADSHEET_ID);
            let users = await getUsers();
            expect(users.length).toBe(2);

            let firstUser = users[0];
            let secondUser = users[1];

            expect(firstUser.name).toBe(FIRST_NAME);
            expect(firstUser.discord_id).toBe(FIRST_DISCORD_ID);
            expect(firstUser.spreadsheet_id).toBe(FIRST_SPREADSHEET_ID);

            expect(secondUser.name).toBe(FIRST_NAME);
            expect(secondUser.discord_id).toBe(SECOND_DISCORD_ID);
            expect(secondUser.spreadsheet_id).toBe(SECOND_SPREADSHEET_ID);
        });

        test("Adding a second user with a duplicate spreadsheet ID causes an error.", async () => {
            await expect(
                UserDal.setUser(SECOND_DISCORD_ID, SECOND_NAME, FIRST_SPREADSHEET_ID)
            ).rejects.toThrow();
            let users = await getUsers();
            expect(users.length).toBe(1);
        });

        describe("Load a second user in the user table.", () => {
            beforeEach(async() => 
                await UserDal.setUser(SECOND_DISCORD_ID, SECOND_NAME, SECOND_SPREADSHEET_ID)
            );

            test("Updating a user's name does not change other users.", async () => {
                await UserDal.setUser(SECOND_DISCORD_ID, "New Name", SECOND_SPREADSHEET_ID);

                let users = await getUsers();

                let firstUser = users[0];
                let secondUser = users[1];

                expect(firstUser.discord_id).toBe(FIRST_DISCORD_ID);
                expect(firstUser.name).toBe(FIRST_NAME);
                expect(firstUser.spreadsheet_id).toBe(FIRST_SPREADSHEET_ID);

                expect(secondUser.discord_id).toBe(SECOND_DISCORD_ID);
                expect(secondUser.name).toBe("New Name");
                expect(secondUser.spreadsheet_id).toBe(SECOND_SPREADSHEET_ID);
            });

            test("Updating a user's spreadsheet ID does not change other users.", async () => {
                await UserDal.setUser(SECOND_DISCORD_ID, SECOND_NAME, "New spreadsheet ID");

                let users = await getUsers();

                let firstUser = users[0];
                let secondUser = users[1];

                expect(firstUser.discord_id).toBe(FIRST_DISCORD_ID);
                expect(firstUser.name).toBe(FIRST_NAME);
                expect(firstUser.spreadsheet_id).toBe(FIRST_SPREADSHEET_ID);

                expect(secondUser.discord_id).toBe(SECOND_DISCORD_ID);
                expect(secondUser.name).toBe(SECOND_NAME);
                expect(secondUser.spreadsheet_id).toBe("New spreadsheet ID");
            });
        });
    });
});

// ==========================
// =====helper functions=====
// ==========================

async function getUsers()
{
    let users = await sequelize.query(
        "SELECT name, discord_id, spreadsheet_id FROM users ORDER BY discord_id ASC",
        { 
            type: QueryTypes.SELECT,
            raw: true 
        }
    );
    return users;
}