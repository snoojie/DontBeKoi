import db from "../../src/db/db";
import { dropAllTables, DATABASE_URL } from "../_setup/db";

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
afterEach(async() => await db.stop());

// after all tests have run,
// revert the environment variables, and
// drop all tables
afterAll(async () => {
    process.env = ORIGINAL_ENV;
    await dropAllTables();
})

test("The database can be started and stopped.", async () => {
    await db.start();
    await db.stop();
});

test("The database can be safely stopped even if it has not started.", async () => {
    await db.stop();
});

test("Starting the database when it is already running causes an error.", async () => {
    await db.start();
    await expect(db.start()).rejects.toThrow();
});

test("The database can be started and stopped multiple times.", async () => {
    await db.start();
    await db.stop();
    await db.start();
    await db.stop();
});