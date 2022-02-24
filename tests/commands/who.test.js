const WhoCommand = require("../../src/commands/who").default;
const { User } = require("../../src/database/models/user");
const { DataAccessLayer } = require("../../src/dataAccessLayer");
const { testName, testDescription, testResponseIsPublic, testOptionsCount, 
        testStringOption } = require("../_setup/command");
const { dropAllTables } = require("../_setup/database");
const { waitGoogleQuota, googleQuotaTimeout, spreadsheets } 
    = require("../_setup/spreadsheet");

const TIMEOUT = googleQuotaTimeout + 30000;

// before any test, 
// clear the database, add all patterns and kois to it, and add some users
beforeAll(async() => {
    await waitGoogleQuota();
    await dropAllTables();
    await DataAccessLayer.start();
    await DataAccessLayer.updatePatterns();
    await DataAccessLayer.stop();
}, TIMEOUT);

// ====================
// =====PROPERTIES=====
// ====================

testName(WhoCommand, "who");
testDescription(WhoCommand, "List everyone who needs a specific koi.");
testResponseIsPublic(WhoCommand);
testOptionsCount(WhoCommand, 2);
testStringOption(WhoCommand.options[0], "color",   "Koi's color.");
testStringOption(WhoCommand.options[1], "pattern", "Koi's pattern.");

// ========================
// =====ERROR CHECKING=====
// ========================

describe("There are two users.", () => {

    beforeAll(async() => {
        await waitGoogleQuota();
        await resetUsers([
            {
                discordId: "discord1", 
                name: "name1", 
                spreadsheetId: spreadsheets.valid
            },
            {
                discordId: "discord2", 
                name: "name2", 
                spreadsheetId: spreadsheets.valid2
            }
        ]);
    }, TIMEOUT);
    afterAll(async() => {
        await resetUsers()
        await waitGoogleQuota();
    }, TIMEOUT);

    beforeEach(async() => await DataAccessLayer.start());
    afterEach(async() => await DataAccessLayer.stop());

    test("Pattern does not exist.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("chashiro", "invalid"));
        expect(RESPONSE).toBe("Pattern 'invalid' does not exist.");
    });

    test("Koi does not exist.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("invalid", "sutaggu"));
        expect(RESPONSE).toBe("Pattern 'sutaggu' does not have koi 'invalid'.");
    });

    describe("Modify environment variables.", () => {
        
        const ORIGINAL_ENV = process.env;
        beforeEach(() => process.env = { ...ORIGINAL_ENV });
        afterAll(() => process.env = { ...ORIGINAL_ENV });

        test("Google API key is invalid.", async() => {
            process.env.GOOGLE_API_KEY = "invalid";
            await expect(WhoCommand.execute(mockInteraction("chashiro", "sutaggu")))
                .rejects.toThrow();
        });
    });

    // ========================
    // =====EVERYONE NEEDS=====
    // ========================

    test("Everyone needs common collector a-m.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("mudai", "beta"));
        expect(
            RESPONSE == "Needing common 11h mudai beta:\n<@discord1> <@discord2>" ||
            RESPONSE == "Needing common 11h mudai beta:\n<@discord2> <@discord1>"
        ).toBeTruthy();
    });

    test("Everyone needs rare collector a-m.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("kousu", "kurinpu"));
        expect(
            RESPONSE == "Needing rare 11h kousu kurinpu:\n<@discord1> <@discord2>" ||
            RESPONSE == "Needing rare 11h kousu kurinpu:\n<@discord2> <@discord1>"
        ).toBeTruthy();
    });

    test("Everyone needs common collector n-z.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("mukatsu", "yumi"));
        expect(
            RESPONSE == "Needing common 10h mukatsu yumi:\n<@discord1> <@discord2>" ||
            RESPONSE == "Needing common 10h mukatsu yumi:\n<@discord2> <@discord1>"
        ).toBeTruthy();
    });

    test("Everyone needs rare collector n-z.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("orimosu", "sutaggu"));
        expect(
            RESPONSE == "Needing rare 5h orimosu sutaggu:\n<@discord1> <@discord2>" ||
            RESPONSE == "Needing rare 5h orimosu sutaggu:\n<@discord2> <@discord1>"
        ).toBeTruthy();
    });

    // =============================
    // =====SOME NEED SOME DONT=====
    // =============================

    test("Some need common collector and some don't.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("ryokoji", "happa"));
        expect("Needing common 10h ryokoji happa:\n<@discord1>");
    });

    test("Some need rare collector and some don't.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("orimosu", "sutaggu"));
        expect("Needing common 5h orimosu sutaggu:\n<@discord2>");
    });

    // ======================
    // =====NO ONE NEEDS=====
    // ======================

    test("No none needs koi.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("kuusu", "usagi"));
        expect(RESPONSE).toBe("Nobody needs rare 5h kuusu usagi.");
    });

});

// =============================================
// =====USER MISSING PATTERN IN SPREADSHEET=====
// =============================================

describe("Test with users with missing pattern.", () => {

    afterAll(async() => await resetUsers());   

    beforeEach(async() => {
        await resetUsers([
            {discordId: "discord1", name: "name1", spreadsheetId: spreadsheets.missingPatterns},
            {discordId: "discord2", name: "name2", spreadsheetId: spreadsheets.valid2}
        ]);
        await DataAccessLayer.start();
    });
    afterEach(async() => await DataAccessLayer.stop());
    
    test("Some need koi and one user missing pattern in spreadsheet.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("akaumi", "rozu"));
        expect(RESPONSE).toBe(
            "Needing rare 10h akaumi rozu:\n<@discord2>\n" +
            "Could not find pattern for <@discord1>"
        );
    });

    test("No one needs koi and one user missing pattern in spreadsheet.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("nedai", "rozu"));
        expect(RESPONSE).toBe(
            "Nobody needs common 10h nedai rozu.\n" +
            "Could not find pattern for <@discord1>"
        );
    });

    test("Several users missing pattern in spreadsheet.", async() => {
        await User.create({
            discordId: "discord3", name: "name3", spreadsheetId: spreadsheets.missingPatterns
        });
        const RESPONSE = await WhoCommand.execute(mockInteraction("neumi", "rozu"));
        expect(
            RESPONSE ==
                "Nobody needs rare 10h neumi rozu.\n" +
                "Could not find pattern for <@discord1> <@discord3>" ||
            RESPONSE ==
                "Nobody needs rare 10h neumi rozu.\n" +
                "Could not find pattern for <@discord3> <@discord1>"
        ).toBeTruthy();
    });
});

// =========================================
// =====USER MISSING KOI IN SPREADSHEET=====
// =========================================

describe("Test with users with missing koi.", () => {

    afterAll(async() => await resetUsers());   

    beforeEach(async() => {
        await resetUsers([{
            discordId: "discord1", name: "name1", spreadsheetId: spreadsheets.koiTypo
        }]);
        await DataAccessLayer.start();
    });
    afterEach(async() => await DataAccessLayer.stop());
    
    test("One user missing koi in spreadsheet.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("kukatsu", "hoseki"));
        expect(RESPONSE).toBe(
            "Nobody needs common 9h kukatsu hoseki.\n" +
            "Could not find koi for <@discord1>"
        );
    });

    test("Several users missing koi in spreadsheet.", async() => {
        await User.create({
            discordId: "discord2", name: "name2", spreadsheetId: spreadsheets.koiTypo
        });
        const RESPONSE = await WhoCommand.execute(mockInteraction("kukatsu", "hoseki"));
        expect(
            RESPONSE ==
                "Nobody needs common 9h kukatsu hoseki.\n" +
                "Could not find koi for <@discord1> <@discord2>" ||
            RESPONSE ==
                "Nobody needs common 9h kukatsu hoseki.\n" +
                "Could not find koi for <@discord2> <@discord1>"
        ).toBeTruthy();
    });

    test("User missing koi and pattern.", async() => {
        await User.create({
            discordId: "discord2", name: "name2", spreadsheetId: spreadsheets.missingPatterns
        });
        const RESPONSE = await WhoCommand.execute(mockInteraction("mashiro", "rozu"));
        expect(RESPONSE).toBe(
            "Nobody needs common 10h mashiro rozu.\n" +
            "Could not find pattern for <@discord2>\n" +
            "Could not find koi for <@discord1>"
        );
    });
});

// =======================================
// =====USER WITH DELETED SPREADSHEET=====
// =======================================

describe("Test with users with deleted spreadsheet.", () => {

    afterAll(async() => await resetUsers());   

    beforeEach(async() => {
        await resetUsers([
            {discordId: "discord1", name: "name1", spreadsheetId: "invalid1"}
        ]);
        await DataAccessLayer.start();
    });
    afterEach(async() => await DataAccessLayer.stop());

    test("Some need koi and one user has a deleted spreadsheet.", async() => {
        await User.create(
            {discordId: "discord2", name: "name2", spreadsheetId: spreadsheets.valid}
        );
        const RESPONSE = await WhoCommand.execute(mockInteraction("buusu", "suno"));
        expect(RESPONSE).toBe(
            "Needing common 6h buusu suno:\n<@discord2>\n" +
            "Spreadsheet does not exist for <@discord1>"
        );
    });

    test("No one needs koi and several users have deleted spreadsheets.", async() => {
        await User.create(
            {discordId: "discord2", name: "name2", spreadsheetId: "invalid"}
        );
        const RESPONSE = await WhoCommand.execute(mockInteraction("ryoumi", "suno"));
        expect(
            RESPONSE ==
                "Nobody needs common 6h ryoumi suno.\n" +
                "Spreadsheet does not exist for <@discord1> <@discord2>" ||
            RESPONSE ==
                "Nobody needs common 6h ryoumi suno.\n" +
                "Spreadsheet does not exist for <@discord2> <@discord1>"
        ).toBeTruthy();
    });

    test("Users missing spreadsheet, koi, and pattern.", async() => {
        await User.bulkCreate([
            {discordId: "discord2", name: "name2", spreadsheetId: spreadsheets.missingPatterns},
            {discordId: "discord3", name: "name3", spreadsheetId: spreadsheets.koiTypo}
        ]);
        const RESPONSE = await WhoCommand.execute(mockInteraction("madai", "rozu"));
        expect(RESPONSE).toBe(
            "Nobody needs common 10h madai rozu.\n" +
            "Could not find pattern for <@discord2>\n" +
            "Could not find koi for <@discord3>\n" +
            "Spreadsheet does not exist for <@discord1>"
        );
    });
});

// =======================================
// =====USER WITH PRIVATE SPREADSHEET=====
// =======================================

describe("Test with users with private spreadsheet.", () => {

    afterAll(async() => await resetUsers());   

    beforeEach(async() => {
        await resetUsers([{
            discordId: "discord1", name: "name1", spreadsheetId: spreadsheets.private
        }]);
        await DataAccessLayer.start();
    });
    afterEach(async() => await DataAccessLayer.stop());

    test("User has private spreadsheet.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("aoukon", "modoru"));
        expect(RESPONSE).toBe(
            "Nobody needs common 5h aoukon modoru.\n" +
            "Spreadsheet is private for <@discord1>"
        );
    });

    test("Several users have private spreadsheets.", async() => {
        await User.create({
            discordId: "discord2", name: "name2", spreadsheetId: spreadsheets.private
        });
        const RESPONSE = await WhoCommand.execute(mockInteraction("aoukon", "modoru"));
        expect(
            RESPONSE == 
                "Nobody needs common 5h aoukon modoru.\n" +
                "Spreadsheet is private for <@discord1> <@discord2>" ||
            RESPONSE == 
                "Nobody needs common 5h aoukon modoru.\n" +
                "Spreadsheet is private for <@discord2> <@discord1>"
        ).toBeTruthy();
    });

    test("Missing spreadsheet, koi, and pattern, and private spreadsheet.", async() => {          
        await User.bulkCreate([
            {discordId: "discord2", name: "name2", spreadsheetId: spreadsheets.missingPatterns},
            {discordId: "discord3", name: "name3", spreadsheetId: spreadsheets.koiTypo},
            {discordId: "discord4", name: "name4", spreadsheetId: "invalid"}
        ]);
        const RESPONSE = await WhoCommand.execute(mockInteraction("mashiro", "rozu"));
        expect(RESPONSE).toBe(
            "Nobody needs common 10h mashiro rozu.\n" +
            "Could not find pattern for <@discord2>\n" + 
            "Could not find koi for <@discord3>\n" + 
            "Spreadsheet does not exist for <@discord4>\n" +
            "Spreadsheet is private for <@discord1>" 
        );
    });
});

// =====================================
// =====USER WITH BROKEN FORMATTING=====
// =====================================

describe("Test with users with broken formatting in their spreadsheet.", () => {

    afterAll(async() => await resetUsers());   

    beforeEach(async() => {
        await resetUsers([{
            discordId: "discord1", name: "name1", spreadsheetId: spreadsheets.extraRow
        }]);
        await DataAccessLayer.start();
    });
    afterEach(async() => await DataAccessLayer.stop());

    test("User has extra rows in their spreadsheet.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("bushiro", "mukei"));
        expect(RESPONSE).toBe(
            "Nobody needs common 10h bushiro mukei.\n" +
            "Spreadsheet formatting broken for <@discord1>"
        );
    });

    test("User has sheet renamed.", async() => {
        await User.create({
            discordId: "discord2", name: "name2", spreadsheetId: spreadsheets.renamedSheets
        });
        const RESPONSE = await WhoCommand.execute(mockInteraction("ryoburu", "uoza"));
        expect(RESPONSE).toBe(
            "Needing rare 10h ryoburu uoza:\n" +
            "<@discord1>\n" +
            "Spreadsheet formatting broken for <@discord2>"
        );
    });

    test("Several users have broken formatting.", async() => {
        await User.create({
            discordId: "discord2", name: "name2", spreadsheetId: spreadsheets.renamedSheets
        });
        const RESPONSE = await WhoCommand.execute(mockInteraction("mupinku", "mukei"));
        expect(
            RESPONSE ==
                "Nobody needs rare 10h mupinku mukei.\n" +
                "Spreadsheet formatting broken for <@discord1> <@discord2>" ||
            RESPONSE ==
                "Nobody needs rare 10h mupinku mukei.\n" +
                "Spreadsheet formatting broken for <@discord2> <@discord1>"
        ).toBeTruthy();
    });

    test("Missing spreadsheet, koi, and pattern, and private spreadsheet, and broken formatting.", 
        async() => 
    {          
        await User.bulkCreate([
            {discordId: "discord2", name: "name2", spreadsheetId: spreadsheets.missingPatterns},
            {discordId: "discord3", name: "name3", spreadsheetId: spreadsheets.private},
            {discordId: "discord4", name: "name4", spreadsheetId: "invalid"},
            {discordId: "discord5", name: "name5", spreadsheetId: spreadsheets.renamedSheets},
            {discordId: "discord6", name: "name6", spreadsheetId: spreadsheets.koiTypo}
        ]);
        const RESPONSE = await WhoCommand.execute(mockInteraction("madai", "rozu"));
        expect(RESPONSE).toBe(
            "Needing common 10h madai rozu:\n" +
            "<@discord1>\n" +
            "Could not find pattern for <@discord2>\n" + 
            "Could not find koi for <@discord6>\n" + 
            "Spreadsheet does not exist for <@discord4>\n" +
            "Spreadsheet is private for <@discord3>\n" +
            "Spreadsheet formatting broken for <@discord5>" 
        );
    });
});

function mockInteraction(koi, pattern)
{
    return { 
        options: { 
            getString: (param) => {
                return param == "pattern" ? pattern : koi
            }
        },
        user: {
            id: "someid",
            username: "somename"
        }
    };
}

async function resetUsers(users)
{
    await DataAccessLayer.start();
    await User.sync({force: true});
    if (users)
    {
        await User.bulkCreate(users);
    }
    await DataAccessLayer.stop();
}