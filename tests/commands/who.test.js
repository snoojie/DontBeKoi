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
testOptionsCount(WhoCommand, 1);
testStringOption(WhoCommand.options[0], "koi",   "Koi's name and pattern.");

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
        const RESPONSE = await WhoCommand.execute(mockInteraction("chashiro invalid"));
        expect(RESPONSE).toBe("Neither 'chashiro' nor 'invalid' are valid patterns.");
    });

    test("Koi does not exist.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("invalid sutaggu"));
        expect(RESPONSE).toBe("Pattern 'sutaggu' does not have koi 'invalid'.");
    });

    test("Both provided names are patterns.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("beta sutaggu"));
        expect(RESPONSE).toBe("Pattern 'sutaggu' does not have koi 'beta'.");
    });

    test("Provided only koi name.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("shishiro"));
        expect(RESPONSE).toBe(
            "Provide both the koi name and pattern, for example: shishiro inazuma"
        );
    });

    test("Provided only pattern name.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("inazuma"));
        expect(RESPONSE).toBe(
            "Provide both the koi name and pattern, for example: shishiro inazuma"
        );
    });

    test("Provided two kois.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction(
            "shishiro inazuma kugin miraju"
        ));
        expect(RESPONSE).toBe(
            "Provide both the koi name and pattern, for example: shishiro inazuma"
        );
    });

    describe("Modify environment variables.", () => {
        
        const ORIGINAL_ENV = process.env;
        beforeEach(() => process.env = { ...ORIGINAL_ENV });
        afterAll(() => process.env = { ...ORIGINAL_ENV });

        test("Google API key is invalid.", async() => {
            process.env.GOOGLE_API_KEY = "invalid";
            await expect(WhoCommand.execute(mockInteraction("chashiro sutaggu")))
                .rejects.toThrow();
        });
    });

    // ========================
    // =====EVERYONE NEEDS=====
    // ========================

    test("Everyone needs common collector a-m.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("mudai beta"));
        expect(
            RESPONSE == "Needing common 11h mudai beta:\n<@discord1> <@discord2>" ||
            RESPONSE == "Needing common 11h mudai beta:\n<@discord2> <@discord1>"
        ).toBeTruthy();
    });

    test("Everyone needs rare collector a-m.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("kousu kurinpu"));
        expect(
            RESPONSE == "Needing rare 11h kousu kurinpu:\n<@discord1> <@discord2>" ||
            RESPONSE == "Needing rare 11h kousu kurinpu:\n<@discord2> <@discord1>"
        ).toBeTruthy();
    });

    test("Everyone needs common collector n-z.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("mukatsu yumi"));
        expect(
            RESPONSE == "Needing common 10h mukatsu yumi:\n<@discord1> <@discord2>" ||
            RESPONSE == "Needing common 10h mukatsu yumi:\n<@discord2> <@discord1>"
        ).toBeTruthy();
    });

    test("Everyone needs rare collector n-z.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("orimosu sutaggu"));
        expect(
            RESPONSE == "Needing rare 5h orimosu sutaggu:\n<@discord1> <@discord2>" ||
            RESPONSE == "Needing rare 5h orimosu sutaggu:\n<@discord2> <@discord1>"
        ).toBeTruthy();
    });

    test("Everyone needs common progressive.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("kishiro shapu"));
        expect(
            RESPONSE == "Needing common kishiro shapu:\n<@discord1> <@discord2>" ||
            RESPONSE == "Needing common kishiro shapu:\n<@discord2> <@discord1>"
        ).toBeTruthy();
    });

    test("Everyone needs rare progressive.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("kupinku ogon"));
        expect(
            RESPONSE == "Needing rare kupinku ogon:\n<@discord1> <@discord2>" ||
            RESPONSE == "Needing rare kupinku ogon:\n<@discord2> <@discord1>"
        ).toBeTruthy();
    });

    test("Everyone needs koi whose name and pattern name are swapped.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("mame shipinku"));
        expect(
            RESPONSE == "Needing rare mame shipinku:\n<@discord1> <@discord2>" ||
            RESPONSE == "Needing rare mame shipinku:\n<@discord2> <@discord1>"
        ).toBeTruthy();
    });

    // =============================
    // =====SOME NEED SOME DONT=====
    // =============================

    test("Some need common collector and some don't.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("ryokoji happa"));
        expect("Needing common 10h ryokoji happa:\n<@discord1>");
    });

    test("Some need rare collector and some don't.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("orimosu sutaggu"));
        expect("Needing common 5h orimosu sutaggu:\n<@discord2>");
    });

    test("Some need common progressive and some don't.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("kuukon kanoko"));
        expect("Needing common kuukon kanoko:\n<@discord1>");
    });

    test("Some need rare progressive and some don't.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("akamido utsuri"));
        expect("Needing common akamido utsuri:\n<@discord2>");
    });

    test("Some need koi whose name and pattern name are swapped.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("bureku seishiro"));
        expect("Needing 10h common bureku seishiro:\n<@discord2>");
    });

    // ======================
    // =====NO ONE NEEDS=====
    // ======================

    test("No none needs collector.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("kuusu usagi"));
        expect(RESPONSE).toBe("Nobody needs rare 5h kuusu usagi.");
    });

    test("No none needs progressive.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("shishiro inazuma"));
        expect(RESPONSE).toBe("Nobody needs common shishiro inazuma.");
    });

    test("No none needs koi whose name and pattern name are swapped.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("naisu mashiro"));
        expect(RESPONSE).toBe("Nobody needs common 11h naisu mashiro.");
    });

});

// =============================================
// =====USER MISSING PATTERN IN SPREADSHEET=====
// =============================================

describe("Test with users who are missing pattern.", () => {

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
        const RESPONSE = await WhoCommand.execute(mockInteraction("akaumi rozu"));
        expect(RESPONSE).toBe(
            "Needing rare 10h akaumi rozu:\n<@discord2>\n" +
            "<@discord1>: Spreadsheet missing collector rozu."
        );
    });

    test("No one needs koi and one user missing pattern in spreadsheet.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("nedai rozu"));
        expect(RESPONSE).toBe(
            "Nobody needs common 10h nedai rozu.\n" +
            "<@discord1>: Spreadsheet missing collector rozu."
        );
    });

    test("Several users missing pattern in spreadsheet.", async() => {
        await User.create({
            discordId: "discord3", name: "name3", spreadsheetId: spreadsheets.missingPatterns
        });
        const RESPONSE = await WhoCommand.execute(mockInteraction("neumi rozu"));
        expectResponse(
            RESPONSE, 
            [ "Nobody needs rare 10h neumi rozu." ], 
            [
                "<@discord1>: Spreadsheet missing collector rozu.",
                "<@discord3>: Spreadsheet missing collector rozu."
            ]
        );
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
        const RESPONSE = await WhoCommand.execute(mockInteraction("kukatsu hoseki"));
        expect(RESPONSE).toBe(
            "Nobody needs common 9h kukatsu hoseki.\n" +
            "<@discord1>: Spreadsheet missing koi kukatsu for collector hoseki."
        );
    });

    test("Several users missing koi in spreadsheet.", async() => {
        await User.create({
            discordId: "discord2", name: "name2", spreadsheetId: spreadsheets.koiTypo
        });
        const RESPONSE = await WhoCommand.execute(mockInteraction("kukatsu hoseki"));
        expectResponse(
            RESPONSE, 
            [ "Nobody needs common 9h kukatsu hoseki." ], 
            [
                "<@discord1>: Spreadsheet missing koi kukatsu for collector hoseki.",
                "<@discord2>: Spreadsheet missing koi kukatsu for collector hoseki."
            ]
        );
    });

    test("User missing koi and pattern.", async() => {
        await User.create({
            discordId: "discord2", name: "name2", spreadsheetId: spreadsheets.missingPatterns
        });
        const RESPONSE = await WhoCommand.execute(mockInteraction("kukatsu hoseki"));
        expectResponse(
            RESPONSE,
            [ "Nobody needs common 9h kukatsu hoseki." ],
            [
                "<@discord1>: Spreadsheet missing koi kukatsu for collector hoseki.",
                "<@discord2>: Spreadsheet missing collector hoseki."
            ]
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
        const RESPONSE = await WhoCommand.execute(mockInteraction("buusu suno"));
        expect(RESPONSE).toBe(
            "Needing common 6h buusu suno:\n<@discord2>\n" +
            "<@discord1>: Spreadsheet does not exist."
        );
    });

    test("No one needs koi and several users have deleted spreadsheets.", async() => {
        await User.create(
            {discordId: "discord2", name: "name2", spreadsheetId: "invalid"}
        );
        const RESPONSE = await WhoCommand.execute(mockInteraction("ryoumi suno"));
        expectResponse(
            RESPONSE,
            [ "Nobody needs common 6h ryoumi suno." ],
            [ 
                "<@discord1>: Spreadsheet does not exist.",
                "<@discord2>: Spreadsheet does not exist." 
            ]
        );
    });

    test("Users missing spreadsheet, koi, and pattern.", async() => {
        await User.bulkCreate([
            {discordId: "discord2", name: "name2", spreadsheetId: spreadsheets.missingPatterns},
            {discordId: "discord3", name: "name3", spreadsheetId: spreadsheets.koiTypo}
        ]);
        const RESPONSE = await WhoCommand.execute(mockInteraction("kukatsu hoseki"));
        expectResponse(
            RESPONSE,
            [ "Nobody needs common 9h kukatsu hoseki." ],
            [ 
                "<@discord1>: Spreadsheet does not exist.",
                "<@discord2>: Spreadsheet missing collector hoseki.",
                "<@discord3>: Spreadsheet missing koi kukatsu for collector hoseki."
            ]
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
        const RESPONSE = await WhoCommand.execute(mockInteraction("aoukon modoru"));
        expect(RESPONSE).toBe(
            "Nobody needs common 5h aoukon modoru.\n" +
            "<@discord1>: Spreadsheet is private."
        );
    });

    test("Several users have private spreadsheets.", async() => {
        await User.create({
            discordId: "discord2", name: "name2", spreadsheetId: spreadsheets.private
        });
        const RESPONSE = await WhoCommand.execute(mockInteraction("aoukon modoru"));
        expectResponse(
            RESPONSE,
            [ "Nobody needs common 5h aoukon modoru." ],
            [ 
                "<@discord1>: Spreadsheet is private.",
                "<@discord2>: Spreadsheet is private." 
            ]
        );
    });

    test("Missing spreadsheet, koi, and pattern, and private spreadsheet.", async() => {          
        await User.bulkCreate([
            {discordId: "discord2", name: "name2", spreadsheetId: spreadsheets.missingPatterns},
            {discordId: "discord3", name: "name3", spreadsheetId: spreadsheets.koiTypo},
            {discordId: "discord4", name: "name4", spreadsheetId: "invalid"},
            {discordId: "discord5", name: "name5", spreadsheetId: spreadsheets.valid}
        ]);
        const RESPONSE = await WhoCommand.execute(mockInteraction("kumido supure"));
        expectResponse(
            RESPONSE,
            [ 
                "Needing rare kumido supure:",
                "<@discord5>"
            ],
            [ 
                "<@discord1>: Spreadsheet is private.",
                "<@discord2>: Spreadsheet missing progressive supure.",
                "<@discord3>: Spreadsheet missing koi kumido for progressive supure.",
                "<@discord4>: Spreadsheet does not exist."
            ]
        );
    });
});

// ==================================
// =====USER WITH RENAMED SHEETS=====
// ==================================

describe("Test with users with renamed sheets.", () => {

    afterAll(async() => await resetUsers());   

    beforeEach(async() => {
        await resetUsers([
            { discordId: "discord1", name: "name1", spreadsheetId: spreadsheets.renamedSheets },
            { discordId: "discord2", name: "name2", spreadsheetId: spreadsheets.valid }
        ]);
        await DataAccessLayer.start();
    });
    afterEach(async() => await DataAccessLayer.stop());

    test("User has renamed sheets.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("Kishiro Godan"));
        expect(RESPONSE).toBe(
            "Needing common Kishiro Godan:\n" +
            "<@discord2>\n" +
            "<@discord1>: Spreadsheet does not have range 'Progressives!I2:AN70'."
        );
    });

    test("Missing spreadsheet, koi, and pattern; private spreadsheet; renamed sheets.", 
        async() => 
    {          
        await User.bulkCreate([
            {discordId: "discord3", name: "name3", spreadsheetId: spreadsheets.missingPatterns},
            {discordId: "discord4", name: "name4", spreadsheetId: spreadsheets.koiTypo},
            {discordId: "discord5", name: "name5", spreadsheetId: "invalid"},
            {discordId: "discord6", name: "name6", spreadsheetId: spreadsheets.private},
        ]);
        const RESPONSE = await WhoCommand.execute(mockInteraction("kupinku supure"));
        expectResponse(
            RESPONSE,
            [ 
                "Needing rare kupinku supure:",
                "<@discord2>"
            ],
            [ 
                "<@discord1>: Spreadsheet does not have range 'Progressives!I2:AN70'.",
                "<@discord3>: Spreadsheet missing progressive supure.",
                "<@discord4>: Spreadsheet missing koi kupinku for progressive supure.",
                "<@discord5>: Spreadsheet does not exist.",
                "<@discord6>: Spreadsheet is private.",
            ]
        );
    });
});

// ========================================
// =====USER WITH UNKNOWN KOI PROGRESS=====
// ========================================

describe("Test with users with unknown koi progress.", () => {

    afterAll(async() => await resetUsers());   

    beforeEach(async() => {
        await resetUsers([
            { discordId: "discord1", name: "name1", spreadsheetId: spreadsheets.invalidKoiProgress },
            { discordId: "discord2", name: "name2", spreadsheetId: spreadsheets.badButValidKoiProgress }
        ]);
        await DataAccessLayer.start();
    });
    afterEach(async() => await DataAccessLayer.stop());

    test("User has unknown koi progress.", async() => {
        const RESPONSE = await WhoCommand.execute(mockInteraction("mausu naisu"));
        expect(RESPONSE).toBe(
            "Needing rare 11h mausu naisu:\n" +
            "<@discord2>\n" +
            "<@discord1>: Spreadsheet has collector Mausu Naisu marked with " +
                "'dk' instead of 'k', 'd', or no text."
        );
    });

    test("Missing spreadsheet, koi, and pattern; private spreadsheet; renamed sheets; unknown koi progress.", 
        async() => 
    {          
        await User.bulkCreate([
            {discordId: "discord3", name: "name3", spreadsheetId: spreadsheets.missingPatterns},
            {discordId: "discord4", name: "name4", spreadsheetId: spreadsheets.koiTypo},
            {discordId: "discord5", name: "name5", spreadsheetId: "invalid"},
            {discordId: "discord6", name: "name6", spreadsheetId: spreadsheets.private},
            {discordId: "discord7", name: "name7", spreadsheetId: spreadsheets.renamedSheets},
        ]);
        const RESPONSE = await WhoCommand.execute(mockInteraction("Kushiro Supure"));
        expectResponse(
            RESPONSE,
            [ "Nobody needs common Kushiro Supure." ],
            [ 
                "<@discord1>: Spreadsheet has progressive Kudai Toraiu marked with " +
                    "'invalid' instead of 'k', 'd', or no text.",
                "<@discord3>: Spreadsheet missing progressive Supure.",
                "<@discord4>: Spreadsheet missing koi Kushiro for progressive Supure.",
                "<@discord5>: Spreadsheet does not exist.",
                "<@discord6>: Spreadsheet is private.",
                "<@discord7>: Spreadsheet does not have range 'Progressives!I2:AN70'."
            ]
        );
    });
});



// ==================================
// =====USER WITH BAD FORMATTING=====
// ==================================

describe("Test with users with bad formatting.", () => {

    afterAll(async() => await resetUsers());   

    beforeEach(async() => {
        await resetUsers([
            { discordId: "discord1", name: "name1", spreadsheetId: spreadsheets.valid }
        ]);
        await DataAccessLayer.start();
    });
    afterEach(async() => await DataAccessLayer.stop());

    test("Users with empty colors and empty pattern names.", async() => {
        await User.bulkCreate([
            { discordId: "discord2", name: "name2", spreadsheetId: spreadsheets.missingBaseColors },
            { discordId: "discord3", name: "name3", spreadsheetId: spreadsheets.missingHighlightColors },
            { discordId: "discord4", name: "name4", spreadsheetId: spreadsheets.missingPatternNames }
        ]);
        const RESPONSE = await WhoCommand.execute(mockInteraction("kuburu nidan"));
        expectResponse(
            RESPONSE,
            [ "Nobody needs rare kuburu nidan." ],
            [
                "<@discord2>: Spreadsheet missing color for progressive Goromo in " +
                    "row 11, column T.",
                "<@discord3>: Spreadsheet missing color for progressive Meisai in " + 
                    "row 52, column R.",
                "<@discord4>: Spreadsheet missing pattern in sheet 'Progressives', " +
                    "row 23, column AE."
            ]
        )
    });

    test("User has extra rows affecting base colors.", async() => {
        await User.create({
            discordId: "discord2", name: "name2", spreadsheetId: spreadsheets.missingBaseColors,
        });
        const RESPONSE = await WhoCommand.execute(mockInteraction("Chakura Pazuru"));
        expect(RESPONSE).toBe(
            "Nobody needs common 6h Chakura Pazuru.\n" +
            "<@discord2>: Spreadsheet missing color for collector Onmyo in " +
                "row 83, column B."
        );
    });

    test("Users with extra rows and columns.", async() => {
        await User.bulkCreate([
            { discordId: "discord2", name: "name2", spreadsheetId: spreadsheets.missingPatternNames },
            { discordId: "discord3", name: "name3", spreadsheetId: spreadsheets.missingHighlightColors }
        ]);
        const RESPONSE = await WhoCommand.execute(mockInteraction("bucheri aishite"));
        expectResponse(
            RESPONSE,
            [ 
                "Needing rare 10h bucheri aishite:",
                "<@discord1>"
            ],
            [
                "<@discord2>: Spreadsheet missing pattern in sheet 'A-M: Collectors', " +
                    "row 198, column B.",
                "<@discord3>: Spreadsheet missing color for collector Aishite in " + 
                    "row 3, column H.",
            ]
        )
    });
});

function mockInteraction(param)
{
    return { 
        options: { 
            getString: () => param
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

function expectResponse(received, expectedSuccess, expectedErrors)
{
    expectedErrors = expectedErrors ? expectedErrors : [];

    const RECEIVED_LINES = received.split("\n");
    expect(RECEIVED_LINES.length).toBe(expectedSuccess.length + expectedErrors.length);

    const RECEIVED_SUCCESS = RECEIVED_LINES.slice(0, expectedSuccess.length);
    for (let i=0; i<expectedSuccess.length; i++)
    {
        expect(RECEIVED_SUCCESS[i]).toEqual(expectedSuccess[i]);
    }

    const RECEIVED_ERRORS = RECEIVED_LINES.slice(expectedSuccess.length).sort();
    expectedErrors = expectedErrors.sort();
    for (let i=0; i<expectedErrors.length; i++)
    {
        expect(RECEIVED_ERRORS[i]).toEqual(expectedErrors[i]);
    }
}