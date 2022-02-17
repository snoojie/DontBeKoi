const GoogleCommand = require("../../src/commands/google").default;

// ====================
// =====PROPERTIES=====
// ====================

test("Name is google.", () => {
    expect(GoogleCommand.name).toBe("google");
});

test("Has a description.", () => {
    expect(GoogleCommand.description).toBe("Register your google spreadsheet.");
});

test("Response is private.", () => {
    expect(GoogleCommand.isPrivate);
});

test("Has spreadsheet option.", () => {
    expect(GoogleCommand.options.length).toBe(1);
    const OPTION = GoogleCommand.options[0];
    expect(OPTION.name).toBe("spreadsheet");
    expect(OPTION.description).toBe("ID of your google spreadsheet.");
    expect(!OPTION.type || OPTION.type == "string").toBeTruthy();
});

// ========================
// =====ERROR CHECKING=====
// ========================

test("Validate spreadsheet ID.", async() => {
    const RESPONSE = await GoogleCommand.execute(mockInteraction("invalidspreadsheet"));
    expect(RESPONSE).toBe(
        "Spreadsheet ID invalidspreadsheet is not valid. " +
        "You can find the ID in the URL. For example, spreadsheet " +
        "<https://docs.google.com/spreadsheets/d/1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo/edit?usp=sharing> " +
        "has ID 1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo"
    );
});

// todo more testing

function mockInteraction(text)
{
    return { 
        options: { getString: () => text }
    };
}