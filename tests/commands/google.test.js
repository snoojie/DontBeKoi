const GoogleCommand = require("../../src/commands/google").default;
const { DataAccessLayer } = require("../../src/dataAccessLayer");
const { User } = require("../../src/database/models/user");
const { testName, testDescription, testResponseIsPrivate, testOptionsCount, 
        testStringOption } = require("../_setup/command");
const { waitGoogleQuota, googleQuotaTimeout, spreadsheets } 
    = require("../_setup/spreadsheet");

beforeAll(async() => {
    await waitGoogleQuota();
}, googleQuotaTimeout);

// empty User table before each test
beforeEach(async() => {
    await DataAccessLayer.start();
    await User.sync({force:true});
});

afterEach(async() => await DataAccessLayer.stop());

afterAll(async() => {
    await DataAccessLayer.start();
    await User.sync({force:true});
    await DataAccessLayer.stop();
});

// ====================
// =====PROPERTIES=====
// ====================

testName(GoogleCommand, "google");
testDescription(GoogleCommand, "Register your google spreadsheet.");
testResponseIsPrivate(GoogleCommand);
testOptionsCount(1);
testStringOption(
    GoogleCommand.options[0], "spreadsheet", "ID of your google spreadsheet."
);

// ========================
// =====ERROR CHECKING=====
// ========================

test("Spreadsheet does not exist.", async() => {
    const RESPONSE = await GoogleCommand.execute(mockInteraction("invalidspreadsheet"));
    expect(RESPONSE).toBe(
        "Spreadsheet ID invalidspreadsheet is not valid. " +
        "You can find the ID in the URL. For example, spreadsheet " +
        "<https://docs.google.com/spreadsheets/d/1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo/edit?usp=sharing> " +
        "has ID 1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo"
    );
});

test("Private spreadsheet.", async() => {
    const RESPONSE = await GoogleCommand.execute(mockInteraction(spreadsheets.private));
    expect(RESPONSE).toBe(
        `Spreadsheet ID ${spreadsheets.private} is private. ` +
        "Share it so that anyone with the link can view it."
    );
});

describe("Modifying environment variables.", () => {

    const ORIGINAL_ENV = process.env;
    beforeAll(() => process.env = { ...ORIGINAL_ENV });
    afterAll(() => process.env = { ...ORIGINAL_ENV });

    test("Google API key is invalid.", async() => {
        process.env.GOOGLE_API_KEY = "invalid";
        await expect(GoogleCommand.execute(mockInteraction(spreadsheets.test)))
            .rejects.toThrow();
    });
});

// ====================
// =====USER SAVED=====
// ====================

test("Response of valid spreadsheet.", async() => {
    const RESPONSE = await GoogleCommand.execute(mockInteraction(spreadsheets.test));
    expectSuccessResponse(RESPONSE);
});

test("User record created in database.", async() => {
    const RESPONSE = await GoogleCommand.execute(mockInteraction(spreadsheets.test));
    expectSuccessResponse(RESPONSE);
    const USER_RECORDS = await User.findAll();
    expect(USER_RECORDS.length).toBe(1);
    expect(USER_RECORDS[0].spreadsheetId).toBe(spreadsheets.test);
    expect(USER_RECORDS[0].discordId).toBe("someid");
    expect(USER_RECORDS[0].name).toBe("somename");
});

test("Preexisting user record updated in database.", async() => {
    await User.create(
        { discordId: "someid", name: "somename", spreadsheetId: "somespreadsheet" }
    );
    const RESPONSE = await GoogleCommand.execute(mockInteraction(spreadsheets.test));
    expectSuccessResponse(RESPONSE);
    const USER_RECORDS = await User.findAll();
    expect(USER_RECORDS.length).toBe(1);
    expect(USER_RECORDS[0].spreadsheetId).toBe(spreadsheets.test);
    expect(USER_RECORDS[0].discordId).toBe("someid");
    expect(USER_RECORDS[0].name).toBe("somename");
});

function expectSuccessResponse(response)
{
    expect(response).toBe(`Updated your spreadsheet to ${spreadsheets.test}`);
}

function mockInteraction(text)
{
    return { 
        options: { 
            getString: () => text 
        },
        user: {
            id: "someid",
            username: "somename"
        }
    };
}