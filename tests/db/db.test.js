const Database = require("../../src/db/db").default;
const { dropAllTables, DATABASE_URL } = require("../_setup/db");

const ORIGINAL_ENV = process.env;

// before any test runs,
// change the database URL in environment variable to a test database
beforeAll(() => {
    process.env = {...ORIGINAL_ENV };
    process.env.DATABASE_URL = DATABASE_URL;
})

// for each test, make sure it starts with no tables in the db
beforeEach(async() => {
    await dropAllTables();
})

// after each test, stop the database in case a test doesn't
afterEach(async() => await Database.stop());

// after all tests have run, drop all tables
afterAll(async () => {
    await dropAllTables();
})

test("The database can be started and stopped.", async () => {
    await Database.start();
    await Database.stop();
});

test("The database can be safely stopped even if it has not started.", async () => {
    await Database.stop();
});

test("Starting the database when it is already running causes an error.", async () => {
    await Database.start();
    await expect(Database.start()).rejects.toThrow();
});

test("The database can be started and stopped multiple times.", async () => {
    await Database.start();
    await Database.stop();
    await Database.start();
    await Database.stop();
});

describe("Missing environment variables.", () => {
    beforeEach(() => delete process.env.DATABASE_URL);
    test("The database throws an error when the database URL is not set in environment variables..", async () => {
        await expect(Database.start()).rejects.toThrow();
    });
});