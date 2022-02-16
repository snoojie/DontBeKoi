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

// ========================
// =====ERROR CHECKING=====
// ========================

test("Cannot have one side.", async() => {
    let response = await RollCommand.execute(mockInteraction(1));
    expectResponseAtLeastTwoSides(response);
});

test("Cannot have zero sides.", async() => {
    let response = await RollCommand.execute(mockInteraction(0));
    expectResponseAtLeastTwoSides(response);
});

test("Cannot have negative sides.", async() => {
    let response = await RollCommand.execute(mockInteraction(-2));
    expectResponseAtLeastTwoSides(response);
});

test("Can roll with only 2 sides.", async() => {
    let response = await RollCommand.execute(mockInteraction(2));
    expect(response).toMatch(/^Rolling a 2 sided dice.... [1-2]$/);
});

test("Can roll with many sides.", async() => {
    let response = await RollCommand.execute(mockInteraction(9));
    expect(response).toMatch(/^Rolling a 9 sided dice.... [1-9]$/);
});

function mockInteraction(number)
{
    return{ 
        options: { getNumber: () => number }
    };
}

function expectResponseAtLeastTwoSides(response)
{
    expect(response).toBe("The dice needs at least 2 sides.");
}