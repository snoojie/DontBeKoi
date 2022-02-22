const { testName, testDescription, testResponseIsPublic, testOptionsCount, 
        testNumberOption } = require("../_setup/command");

const RollCommand = require("../../src/commands/roll").default;

// ====================
// =====PROPERTIES=====
// ====================

testName(RollCommand, "roll");
testDescription(RollCommand, "Roll a dice.");
testResponseIsPublic(RollCommand);
testOptionsCount(RollCommand, 1);
testNumberOption(RollCommand.options[0], "sides", "Number of sides this dice has.");

// ========================
// =====ERROR CHECKING=====
// ========================

test("Cannot have one side.", async() => {
    const RESPONSE = await RollCommand.execute(mockInteraction(1));
    expectResponseAtLeastTwoSides(RESPONSE);
});

test("Cannot have zero sides.", async() => {
    const RESPONSE = await RollCommand.execute(mockInteraction(0));
    expectResponseAtLeastTwoSides(RESPONSE);
});

test("Cannot have negative sides.", async() => {
    const RESPONSE = await RollCommand.execute(mockInteraction(-2));
    expectResponseAtLeastTwoSides(RESPONSE);
});

// ==============================
// =====SUCCESSFUL EXECUTION=====
// ==============================

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
    return { 
        options: { getNumber: () => number }
    };
}

function expectResponseAtLeastTwoSides(response)
{
    expect(response).toBe("The dice needs at least 2 sides.");
}