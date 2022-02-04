const { DataAccessLayer } = require("../../src/database/dataAccessLayer");
const { User } = require("../../src/database/models/user");
const { default: PublicError } = require("../../src/util/publicError");
const Database = require("../../src/database/database").default;
const { dropAllTables, select, insert } = require("../_setup/database");

const USER = { 
    discord_id: "somediscordid", 
    name: "SomeName", 
    spreadsheet_id: "somespreadsheetid"
};

// start each test with an empty database
// run the Database object for each test
beforeEach(async() => {
    await dropAllTables();
    await Database.start();
});
afterEach(async() => {
    await Database.stop();
});
afterAll(async () => await dropAllTables());

// ===================
// =====SAVE USER=====
// ===================

test("Saving user creates that user.", async() => {
    await DataAccessLayer.saveUser(USER.discord_id, USER.name, USER.spreadsheet_id);
    const RECORDS = await select("users");
    expect(RECORDS.length).toBe(1)
    expect(RECORDS[0].discord_id).toBe(USER.discord_id);
    expect(RECORDS[0].name).toBe(USER.name);
    expect(RECORDS[0].spreadsheet_id).toBe(USER.spreadsheet_id);
});

test(
    "Saving user that already exists updates their name and spreadsheet ID.", 
    async() => 
{
    // put the user in the table first
    await insert("users", USER);

    await DataAccessLayer.saveUser(USER.discord_id, "newname", "newspreadsheet");
    const RECORDS = await select("users");
    expect(RECORDS.length).toBe(1);
    expect(RECORDS[0].discord_id).toBe(USER.discord_id);
    expect(RECORDS[0].name).toBe("newname");
    expect(RECORDS[0].spreadsheet_id).toBe("newspreadsheet");
});

// ===============================
// =====GET USERS MISSING KOI=====
// ===============================

describe("Get users missing koi tests.", () => {

    const USER_SNOOJ = { 
        name: "Snooj copy", 
        discordId: "did1", 
        spreadsheetId: "1cUG1W7nqyLyZyeXRp_OH9Q-rIjjLTaSdftedK56-4U0" 
    };
    const USER_NOTHING = {
        name: "Person with nothing", 
        discordId: "did2", 
        spreadsheetId: "1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo" 
    };
    const USER_LUCY = {
        name: "Lucy copy",
        discordId: "did3",
        spreadsheetId: "1TqoQ1rP_SXqpAGb8bB2rF57kdii5A8Ev693896rk9g8"
    };

    beforeEach(async() => {
        User.bulkCreate([USER_SNOOJ, USER_NOTHING, USER_LUCY]);
    });

    // =======================
    // =====INVALID INPUT=====
    // =======================

    test("Error with invalid pattern.", async() => {
        let exceptRejection = await expect(
            DataAccessLayer.getUsersMissingKoi("kukuro", "invalidpattern")
        ).rejects;
        exceptRejection.toThrow(PublicError);
        exceptRejection.toThrow("Pattern invalidpattern does not exist.");
    });

    test("Error with invalid color.", async() => {
        let exceptRejection = await expect(
            DataAccessLayer.getUsersMissingKoi("invalidcolor", "aishite")
        ).rejects;
        exceptRejection.toThrow(PublicError);
        exceptRejection.toThrow("Pattern aishite does not have color invalidcolor.");
    });

    // =====================
    // =====VALID INPUT=====
    // =====================

    test("One person missing a specific koi.", async() => {
        const USERS_MISSING_KOI = 
            await DataAccessLayer.getUsersMissingKoi("maukon", "naisu");
        expect(USERS_MISSING_KOI.discordIds.length).toBe(1);
        expect(USERS_MISSING_KOI.discordIds[0] == USER_NOTHING.discordId);
        expect(USERS_MISSING_KOI.rarity == "Common");
    });

    test("Several people, but not everyone, missing a specific koi.", async() => {
        const USERS_MISSING_KOI = 
            await DataAccessLayer.getUsersMissingKoi("musumi", "mukei");
        expect(USERS_MISSING_KOI.discordIds.length).toBe(2);
        expect(USERS_MISSING_KOI.discordIds).toContain(USER_SNOOJ.discordId);
        expect(USERS_MISSING_KOI.discordIds).toContain(USER_NOTHING.discordId);
        expect(USERS_MISSING_KOI.rarity == "Rare");
    });
    
    test("Everyone missing a specific koi.", async() => {
        const USERS_MISSING_KOI = 
            await DataAccessLayer.getUsersMissingKoi("seiukon", "aishite");
        expect(USERS_MISSING_KOI.discordIds.length).toBe(3);
        expect(USERS_MISSING_KOI.discordIds).toContain(USER_SNOOJ.discordId);
        expect(USERS_MISSING_KOI.discordIds).toContain(USER_NOTHING.discordId);
        expect(USERS_MISSING_KOI.discordIds).toContain(USER_LUCY.discordId);
        expect(USERS_MISSING_KOI.rarity == "Common");
    });

    test("Having draggoned a koi means the user has it already.", async() => {
        // lucy has this koi marked with d
        const USERS_MISSING_KOI = 
            await DataAccessLayer.getUsersMissingKoi("mapapu", "daimon");
        expect(USERS_MISSING_KOI.discordIds.length).toBe(1);
        expect(USERS_MISSING_KOI.discordIds).toContain(USER_NOTHING.discordId);
        expect(USERS_MISSING_KOI.rarity == "Rare");
    });

    test("Marking spreadsheet with capital K marks it as owned.", async() => {
        // I have this marked with K
        const USERS_MISSING_KOI = 
            await DataAccessLayer.getUsersMissingKoi("buumi", "seikyo");
        expect(USERS_MISSING_KOI.discordIds.length).toBe(1);
        expect(USERS_MISSING_KOI.discordIds).toContain(USER_NOTHING.discordId);
        expect(USERS_MISSING_KOI.rarity == "Rare");
    });

    test("Marking spreadsheet with capital D marks it as owned.", async() => {
        // I have this marked with D
        const USERS_MISSING_KOI = 
            await DataAccessLayer.getUsersMissingKoi("bushiro", "seikyo");
        expect(USERS_MISSING_KOI.discordIds.length).toBe(1);
        expect(USERS_MISSING_KOI.discordIds).toContain(USER_NOTHING.discordId);
        expect(USERS_MISSING_KOI.rarity == "Common");
    });

    test("Pattern name is case insensitve.", async() => {
        const USERS_MISSING_KOI = 
            await DataAccessLayer.getUsersMissingKoi("chokatsu", "YUMi");
        expect(USERS_MISSING_KOI.discordIds.length).toBe(1);
        expect(USERS_MISSING_KOI.discordIds).toContain(USER_NOTHING.discordId);
        expect(USERS_MISSING_KOI.rarity == "Common");
    });

    test("Koi name is case insensitve.", async() => {
        const USERS_MISSING_KOI = 
            await DataAccessLayer.getUsersMissingKoi("ShIMURa", "happi");
        expect(USERS_MISSING_KOI.discordIds.length).toBe(1);
        expect(USERS_MISSING_KOI.discordIds).toContain(USER_NOTHING.discordId);
        expect(USERS_MISSING_KOI.rarity == "Rare");
    });

    test("User missing pattern in their spreadsheet needs that koi.", async() => {
        // I removed gekko from my spreadsheet
        const USERS_MISSING_KOI = 
            await DataAccessLayer.getUsersMissingKoi("mugure", "gekko");
        expect(USERS_MISSING_KOI.discordIds.length).toBe(2);
        expect(USERS_MISSING_KOI.discordIds).toContain(USER_NOTHING.discordId);
        expect(USERS_MISSING_KOI.discordIds).toContain(USER_SNOOJ.discordId);
        expect(USERS_MISSING_KOI.rarity == "Common");
    });

});