const Database = require("../../src/database/database").default;
const { dropAllTables } = require("../_setup/database");
const ErrorMessages = require("../../src/errorMessages").default;

const ORIGINAL_ENV = process.env;

// before any test runs,
// change the database URL in environment variable to a test database
//beforeAll(() => process.env.DATABASE_URL = DATABASE_URL);

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
    await expect(Database.start())
        .rejects.toThrow(ErrorMessages.DATABASE.ALREADY_RUNNING);
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
        delete process.env.DATABASE_URL
    });
    afterAll(() => process.env = ORIGINAL_ENV);

    test("Error when the database URL is not set in environment variables.", async () => {
        await expect(Database.start())
            .rejects.toThrow(ErrorMessages.CONFIG.MISSING_ENVIRONMENT_VARIABLE);
    });

    test("Error when the database URL is invalid.", async () => {
        process.env.DATABASE_URL = "wrongurl";
        await expect(Database.start())
            .rejects.toThrow(ErrorMessages.DATABASE.FAILED_CONNECTION);
    });

    test("Can start the database after a failed connection attempt.", async () => {
        
        // failed attempt
        await expect(Database.start()).rejects.toThrow();

        // successful attempt
        process.env = ORIGINAL_ENV;
        await Database.start();
    });
});