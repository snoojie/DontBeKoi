const Google = require("../../src/google/google").default;

const VALID_SPREADSHEET_ID = "1A98i8OxxBrYNfmgOaF638qcyA-K8HXQv3dZjhcjx7iM";

test("Validating valid spreadsheet ID returns true.", async() => {
    let isValid = await Google.validateSpreadsheetId(VALID_SPREADSHEET_ID);
    expect(isValid).toBeTruthy();
});

test("Validating invalid spreadsheet ID returns false.", async() => {
    let isValid = await Google.validateSpreadsheetId("fakeid");
    expect(isValid).not.toBeTruthy();
});

describe("Modify google API key.", () => {

    // remove google API key for each test
    const ORIGINAL_ENV = process.env;
    beforeEach(() => {
        process.env = { ...ORIGINAL_ENV };
        delete process.env.GOOGLE_API_KEY;
    });
    afterAll(() => process.env = ORIGINAL_ENV);

    test("Validating valid spreadsheet ID without a google API key throws error.", async() => {
        await expect(Google.validateSpreadsheetId(VALID_SPREADSHEET_ID)).rejects.toThrow();
    });
    
    test("Validating invalid spreadsheet ID without a google API key throws error.", async() => {
        await expect(Google.validateSpreadsheetId("fakeid")).rejects.toThrow();
    });

    test("Validating valid spreadsheet ID without an incorrect google API key throws error.", async() => {
        process.env.GOOGLE_API_KEY = "fakekey";
        await expect(Google.validateSpreadsheetId(VALID_SPREADSHEET_ID)).rejects.toThrow();
    });

    test("Validating invalid spreadsheet ID without an incorrect google API key throws error.", async() => {
        process.env.GOOGLE_API_KEY = "fakekey";
        await expect(Google.validateSpreadsheetId("fakeid")).rejects.toThrow();
    });

});