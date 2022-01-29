const GoogleCommand = require("../../src/commands/google").default;

test("Name is google", () => {
    expect(GoogleCommand.name).toBe("google");
});

test("Has spreadsheet option", () => {
    let options = GoogleCommand.options;
    expect(options).toBeDefined();
    expect(options.length).toBe(1);
    expect(options[0].name == "spreadsheet");
});