const Google = require("../../src/commands/google").default;

test("Create a new user record in user table.", async() => {
    await Google.execute({
        options: {
            getString: (_) => "someSpreadsheetId"
        },
        user: {
            id: "someID",
            name: "Some Name"
        }
    });
});