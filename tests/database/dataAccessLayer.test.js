const { DataAccessLayer } = require("../../src/database/dataAccessLayer");
const Database = require("../../src/database/database").default;
const { dropAllTables, initSequelize, countRecords } = require("../_setup/database");
const { DataTypes, QueryTypes } = require("sequelize");

const USER = { 
    discord_id: "somediscordid", 
    name: "SomeName", 
    spreadsheet_id: "somespreadsheetid",
    created_at: new Date(),
    updated_at: new Date()
};

let sequelize;

// start each test with an empty database
// run the Database object for each test
beforeEach(async() => {
    await dropAllTables();
    await Database.start();
    sequelize = initSequelize();
});
afterEach(async() => {
    await Database.stop();
    await sequelize.close()
});
afterAll(async () => await dropAllTables());

test("Saving user creates that user.", async() => {
    await DataAccessLayer.saveUser(USER.discord_id, USER.name, USER.spreadsheet_id);
    const RECORDS = await sequelize.query(
        "SELECT * FROM users",
        { type: QueryTypes.SELECT, raw: true }
    );
    expect(RECORDS.length).toBe(1)
    expect(RECORDS[0].discord_id).toBe(USER.discord_id);
    expect(RECORDS[0].name).toBe(USER.name);
    expect(RECORDS[0].spreadsheet_id).toBe(USER.spreadsheet_id);
});

test(
    "Saving user that already exists updates their name and spreadsheet ID.", 
    async() => 
{
    // put the user in the table first
    await sequelize.getQueryInterface().bulkInsert("users", [USER]);

    await DataAccessLayer.saveUser(USER.discord_id, "newname", "newspreadsheet");
    const RECORDS = await sequelize.query(
        "SELECT * FROM users",
        { type: QueryTypes.SELECT, raw: true }
    );
    expect(RECORDS.length).toBe(1);
    expect(RECORDS[0].discord_id).toBe(USER.discord_id);
    expect(RECORDS[0].name).toBe("newname");
    expect(RECORDS[0].spreadsheet_id).toBe("newspreadsheet");
});