const { DataAccessLayer } = require("../../src/dataAccessLayer");
const { Pattern } = require("../../src/database/models/pattern");
const { testName, testDescription, testResponseIsPublic, testOptionsCount }
    = require("../_setup/command");
const { dropAllTables } = require("../_setup/database");
const Command = require("../../src/commands/update").default;
const { Op } = require("sequelize");

// ====================
// =====PROPERTIES=====
// ====================

testName(Command, "update");
testDescription(Command, "Let this bot know that there's a new pattern.");
testResponseIsPublic(Command);
testOptionsCount(Command, 0);

// ===================
// =====EXECUTION=====
// ===================

beforeAll(async() => {
    await dropAllTables();
    await DataAccessLayer.start();
    await DataAccessLayer.updatePatterns();
    await DataAccessLayer.stop();
});

beforeEach(async() => {
    await DataAccessLayer.start();
});

afterEach(async() => {
    await DataAccessLayer.stop();
});

afterAll(async() => {
    await dropAllTables();
});

test("No new patterns.", async() => {
    const RESPONSE = await Command.execute();
    expect(RESPONSE).toBe("There are no new patterns.");
});

test("One new pattern.", async() => {
    await Pattern.destroy({ where: { name: "Hanrin" }});
    const RESPONSE = await Command.execute();
    expect(RESPONSE).toBe("Added new pattern Hanrin.");
});

test("Two new patterns.", async() => {
    await Pattern.destroy({ where: { [Op.or]: [ {name: "Hanrin"}, {name: "Naisu"} ] } });
    const RESPONSE = await Command.execute();
    console.info(RESPONSE);
    expect(RESPONSE == "Added new patterns Hanrin and Naisu." || 
           RESPONSE == "Added new patterns Naisu and Hanrin.").toBeTruthy();
});

test("Three new patterns.", async() => {
    await Pattern.destroy({ where: { [Op.or]: [ 
        {name: "Hanrin"}, {name: "Naisu"}, {name: "Sutaggu"}
    ] } });
    const RESPONSE = await Command.execute();
    const MATCH = RESPONSE.match(
        /^Added new patterns (Hanrin|Naisu|Sutaggu), (Hanrin|Naisu|Sutaggu), and (Hanrin|Naisu|Sutaggu).$/
    );
    expect(MATCH).toBeDefined();
    expect(MATCH.length).toBe(4);
    expect(MATCH.slice(1).sort()).toEqual(["Hanrin", "Naisu", "Sutaggu"]);
});

test("Four new patterns.", async() => {
    await Pattern.destroy({ where: { [Op.or]: [ 
        {name: "Hanrin"}, {name: "Naisu"}, {name: "Sutaggu"}, {name: "Inazuma"}
    ] } });
    const RESPONSE = await Command.execute();
    const MATCH = RESPONSE.match(
        /^Added new patterns (Hanrin|Naisu|Sutaggu|Inazuma), (Hanrin|Naisu|Sutaggu|Inazuma), (Hanrin|Naisu|Sutaggu|Inazuma), and (Hanrin|Naisu|Sutaggu|Inazuma).$/
    );
    expect(MATCH).toBeDefined();
    expect(MATCH.length).toBe(5);
    expect(MATCH.slice(1).sort()).toEqual(["Hanrin", "Inazuma", "Naisu", "Sutaggu"]);
});
