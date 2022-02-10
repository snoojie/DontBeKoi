const GoogleCommand = require("../../src/commands/google").default;

test("Name is google.", () => {
    expect(GoogleCommand.name).toBe("google");
});

test("Has a description.", () => {
    expect(GoogleCommand.description).toBeDefined();
    expect(GoogleCommand.description.length > 0);
});

test("Has exactly one option.", () => {
    expect(GoogleCommand.options).toBeDefined();
    expect(GoogleCommand.options.length).toBe(1);
});

test("Has spreadsheet option.", () => {
    expect(GoogleCommand.options[0].name == "spreadsheet");
});