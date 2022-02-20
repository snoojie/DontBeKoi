const { user } = require("pg/lib/defaults");
const { Database, DatabaseAlreadyRunning, InvalidDatabaseUrl } 
    = require("../../src/database/database");
const { Koi } = require("../../src/database/models/koi");
const { Pattern } = require("../../src/database/models/pattern");
const { User } = require("../../src/database/models/user");
const { dropAllTables, expectTableExists } = require("../_setup/database");
const { expectErrorAsync } = require("../_setup/testutil");

const ORIGINAL_ENV = process.env;

// for each test, make sure it starts with no tables in the database
beforeEach(async() => await dropAllTables());

// after each test, stop the database in case a test doesn't
afterEach(async() => await Database.stop());

// after all tests have run, drop all tables
afterAll(async () => await dropAllTables());

// ================================
// =====GENERAL START AND STOP=====
// ================================

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

// ======================
// =====DATABASE URL=====
// ======================

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

// ==================================
// =====START INITIALIZES MODELS=====
// ==================================


const USER = { name: "Name One", discordId: "did1", spreadsheetId: "sid1" };
const PATTERN = { name: "somepattern", type: "sometype", hatchTime: 99 };
const KOI = { name: "somekoi", patternName: PATTERN.name, rarity: "somerarity" };

test("Start initializes User model.", async() => {
    await Database.start();
    await User.create(USER);
    const COUNT = await User.count();
    expect(COUNT).toBe(1);
});

test("Start initializes Pattern model.", async() => {
    await Database.start();
    await Pattern.create(PATTERN);
    const COUNT = await Pattern.count();
    expect(COUNT).toBe(1);
});

test("Start initializes Koi model.", async() => {
    await Database.start();
    await Pattern.create(PATTERN);
    await Koi.create(KOI);
    const COUNT = await Koi.count();
    expect(COUNT).toBe(1);
});

// ==============================
// =====START CREATES TABLES=====
// ==============================

test("Start creates the users table.", async() => {
    await Database.start();
    expectTableExists("users");
});

test("Start creates the patterns table.", async() => {
    await Database.start();
    expectTableExists("patterns");
});

test("Start creates the kois table.", async() => {
    await Database.start();
    expectTableExists("kois");
});

// ========================================================
// =====START DOES NOT DESTROY ALREADY EXISTING TABLES=====
// ========================================================

describe("Prepopulate database.", () => {

    beforeEach(async() => {
        await Database.start();
        await User.create(USER);
        await Pattern.create(PATTERN);
        await Koi.create(KOI);
        await Database.stop();
    });

    test("Start does not destroy a preexisting users table.", async() => {
        await Database.start();
        const USER_RECORDS = await User.findAll();
        expect(USER_RECORDS.length).toBe(1);
        expect(USER_RECORDS[0].discordId).toBe(USER.discordId);
        expect(USER_RECORDS[0].name).toBe(USER.name);
        expect(USER_RECORDS[0].spreadsheetId).toBe(USER.spreadsheetId);
    });

    test("Start does not destroy a preexisting patterns table.", async() => {
        await Database.start();
        const PATTERN_RECORDS = await Pattern.findAll();
        expect(PATTERN_RECORDS.length).toBe(1);
        expect(PATTERN_RECORDS[0].name).toBe(PATTERN.name);
        expect(PATTERN_RECORDS[0].type).toBe(PATTERN.type);
        expect(PATTERN_RECORDS[0].hatchTime).toBe(PATTERN.hatchTime);
    });

    test("Start does not destroy a preexisting kois table.", async() => {
        await Database.start();
        const KOI_RECORDS = await Koi.findAll();
        expect(KOI_RECORDS.length).toBe(1);
        expect(KOI_RECORDS[0].name).toBe(KOI.name);
        expect(KOI_RECORDS[0].patternName).toBe(KOI.patternName);
        expect(KOI_RECORDS[0].rarity).toBe(KOI.rarity);
    });
});