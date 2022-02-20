const { DataAccessLayer, DataAccessLayerError } = require("../src/dataAccessLayer");
const { Database, DatabaseAlreadyRunning, InvalidDatabaseUrl } = require("../src/database/database");
const { expectErrorAsync } = require("./_setup/testUtil");

afterEach(async() => {
    await DataAccessLayer.stop();
    await Database.stop();
})

// ========================
// =====START AND STOP=====
// ========================

test("Starting the DataAccessLayer starts the database.", async() => {
    await DataAccessLayer.start();
    await expect(Database.start()).rejects.toThrow(DatabaseAlreadyRunning);
});

test("Stopping the DataAccessLayer stops the database.", async() => {
    await DataAccessLayer.start();
    await DataAccessLayer.stop();
    await Database.start(); // if the database wasn't stopped, this would error
    await Database.stop();
});

test("Cannot start DataAccessLayer if the database has already started.", async() => {
    await Database.start();
    await expect(DataAccessLayer.start()).rejects.toThrow(DatabaseAlreadyRunning);
});

test("Cannot start DataAccessLayer if it is already running.", async() => {
    await DataAccessLayer.start();
    await expect(DataAccessLayer.start()).rejects.toThrow(DatabaseAlreadyRunning);
});

test("Can stop the DataAccessLayer even if it isn't running.", async() => {
    await DataAccessLayer.stop();
});

test("Can start and stop multiple times.", async() => {
    await DataAccessLayer.start();
    await DataAccessLayer.stop();
    await DataAccessLayer.start();
    await DataAccessLayer.stop();
});

describe("Modify database URL environment variable.", () => {

    const ORIGINAL_ENV = process.env;
    beforeEach(() => process.env = { ...ORIGINAL_ENV });
    afterAll(() => process.env = { ...ORIGINAL_ENV });

    test("Cannot start if database URL is not set.", async() => {
        delete process.env.DATABASE_URL;
        await expect(DataAccessLayer.start()).rejects.toThrow(InvalidDatabaseUrl);
    });

    test("Cannot start if database URL is wrong.", async() => {
        process.env.DATABASE_URL = "invalidurl";
        await expect(DataAccessLayer.start()).rejects.toThrow(InvalidDatabaseUrl);
    });
});