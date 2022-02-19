const { Database, DatabaseAlreadyRunning, InvalidDatabaseUrl } 
    = require("../../src/database/database");
const { dropAllTables } = require("../_setup/database");
const { expectErrorAsync } = require("../_setup/testutil");
const ErrorMessages = require("../../src/errorMessages").default;

const ORIGINAL_ENV = process.env;

// for each test, make sure it starts with no tables in the database
beforeEach(async() => await dropAllTables());

// after each test, stop the database in case a test doesn't
afterEach(async() => await Database.stop());

// after all tests have run, drop all tables
afterAll(async () => await dropAllTables());

test("The database can be started and stopped.", async () => {
    await Database.start();
    await Database.stop();
});

test("The database can be safely stopped even if it has not started.", async () => {
    await Database.stop();
});

test("Starting the database when it is already running causes an error.", async () => {
    await Database.start();
    await expectErrorAsync(
        Database.start(), 
        DatabaseAlreadyRunning, 
        "Cannot start the database. It is already running."
    );
});

test("The database can be started and stopped multiple times.", async () => {
    await Database.start();
    await Database.stop();
    await Database.start();
    await Database.stop();
});

describe("Database URL environment variable.", () => {
    
    beforeEach(() => {
        process.env = { ...ORIGINAL_ENV };
    });
    afterAll(() => process.env = ORIGINAL_ENV);

    test("Error when the database URL is not set in environment variables.", 
        async () => 
    {
        
        delete process.env.DATABASE_URL
        await expectErrorAsync(
            Database.start(), 
            InvalidDatabaseUrl, 
            "Database URL not set in environment variables."
        );
    });

    test("Error when the database URL is invalid.", async () => {
        process.env.DATABASE_URL = "wrongurl";
        await expectErrorAsync(
            Database.start(), 
            InvalidDatabaseUrl, 
            "Could not connect to the database. Could the URL be invalid?"
        );
    });

    test("Can start the database after a failed connection attempt.", async () => {
        
        // failed attempt
        delete process.env.DATABASE_URL;
        await expect(Database.start()).rejects.toThrow();

        // successful attempt
        process.env = ORIGINAL_ENV;
        await Database.start();
    });
});