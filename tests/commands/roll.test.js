const RollCommand = require("../../src/commands/roll").default;

// ====================
// =====PROPERTIES=====
// ====================

test("Name is roll.", () => {
    expect(RollCommand.name).toBe("roll");
});

test("Has a description.", () => {
    expect(RollCommand.description).toBe("Roll a dice.");
});

test("Has sides option.", () => {
    expect(RollCommand.options).toEqual([{
        name: "sides", type: "number", description: "Number of sides this dice has."
    }]);
});

// =================
// =====EXECUTE=====
// =================