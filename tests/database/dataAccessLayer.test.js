const { DataAccessLayer } = require("../../src/database/dataAccessLayer");
const Database = require("../../src/database/database").default;
const { dropAllTables, select, insert } = require("../_setup/database");

const USER = { 
    discord_id: "somediscordid", 
    name: "SomeName", 
    spreadsheet_id: "somespreadsheetid"
};

// start each test with an empty database
// run the Database object for each test
beforeEach(async() => {
    await dropAllTables();
    await Database.start();
});
afterEach(async() => {
    await Database.stop();
});
afterAll(async () => await dropAllTables());

test("Saving user creates that user.", async() => {
    await DataAccessLayer.saveUser(USER.discord_id, USER.name, USER.spreadsheet_id);
    const RECORDS = await select("users");
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
    await insert("users", USER);

    await DataAccessLayer.saveUser(USER.discord_id, "newname", "newspreadsheet");
    const RECORDS = await select("users");
    expect(RECORDS.length).toBe(1);
    expect(RECORDS[0].discord_id).toBe(USER.discord_id);
    expect(RECORDS[0].name).toBe("newname");
    expect(RECORDS[0].spreadsheet_id).toBe("newspreadsheet");
});