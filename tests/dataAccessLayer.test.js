const { DataAccessLayer, PatternNotFound, KoiNotFound } 
    = require("../src/dataAccessLayer");
const { Database, DatabaseAlreadyRunning, InvalidDatabaseUrl } 
    = require("../src/database/database");
const { dropAllTables } = require("./_setup/database");
const { expectErrorAsync } = require("./_setup/testUtil");
const { Pattern } = require("../src/database/models/pattern");
const { Koi } = require("../src/database/models/koi");
const { User } = require("../src/database/models/user");
const { Op } = require("sequelize");
const { waitGoogleQuota, googleQuotaTimeout, testWithModifiedEnv, spreadsheets } 
    = require("./_setup/spreadsheet");
const { InvalidGoogleApiKey } = require("../src/google/spreadsheet");
const { PrivateSpreadsheet, SpreadsheetNotFound } 
    = require("../src/google/userSpreadsheet");

// wait a minute before starting the tests
// this is because google has a read quota
beforeAll(async() => {
    //await waitGoogleQuota();
}, googleQuotaTimeout);

afterEach(async() => await DataAccessLayer.stop());

// ========================
// =====START AND STOP=====
// ========================

test("Starting the DataAccessLayer starts the database.", async() => {
    await DataAccessLayer.start();
    await expect(Database.start()).rejects.toThrow(DatabaseAlreadyRunning);
});

test("Stopping the DataAccessLayer stops the database.", async() => {
    await DataAccessLayer.start();
    await DataAccessLayer.stop();
    await Database.start(); // if the database wasn't stopped, this would error
    await Database.stop();
});

test("Cannot start DataAccessLayer if the database has already started.", async() => {
    await Database.start();
    await expect(DataAccessLayer.start()).rejects.toThrow(DatabaseAlreadyRunning);
});

test("Cannot start DataAccessLayer if it is already running.", async() => {
    await DataAccessLayer.start();
    await expect(DataAccessLayer.start()).rejects.toThrow(DatabaseAlreadyRunning);
});

test("Can stop the DataAccessLayer even if it isn't running.", async() => {
    await DataAccessLayer.stop();
});

test("Can start and stop multiple times.", async() => {
    await DataAccessLayer.start();
    await DataAccessLayer.stop();
    await DataAccessLayer.start();
    await DataAccessLayer.stop();
});

describe("Modify database URL environment variable.", () => {

    const ORIGINAL_ENV = process.env;
    beforeEach(() => process.env = { ...ORIGINAL_ENV });
    afterAll(() => process.env = { ...ORIGINAL_ENV });

    test("Cannot start if database URL is not set.", async() => {
        delete process.env.DATABASE_URL;
        await expect(DataAccessLayer.start()).rejects.toThrow(InvalidDatabaseUrl);
    });

    test("Cannot start if database URL is wrong.", async() => {
        process.env.DATABASE_URL = "invalidurl";
        await expect(DataAccessLayer.start()).rejects.toThrow(InvalidDatabaseUrl);
    });
});

// =========================
// =====UPDATE PATTERNS=====
// =========================

describe("Update patterns with empty database.", () => {

    beforeAll(async() => {
        await dropAllTables();
        await DataAccessLayer.start();
        await DataAccessLayer.updatePatterns();
        await DataAccessLayer.stop();
    });
    beforeEach(async() => await DataAccessLayer.start());

    test("There are at least 203 collector patterns.", async() => {
        const COUNT = await Pattern.count({ 
            where: { type: { [Op.iLike]: "Collector" } }
        });
        expect(COUNT).toBeGreaterThanOrEqual(203);
    });
    
    test("There are at 30 progressive patterns.", async() => {
        const COUNT = await Pattern.count({ 
            where: { type: { [Op.iLike]: "Progressive" } }
        });
        expect(COUNT).toBe(30);
    });

    test("There are at least 7456 kois.", async() => {
        const COUNT = await Koi.count();
        expect(COUNT).toBeGreaterThanOrEqual(7456);
    });

    test("Adds borei pattern and all its kois.", async() => {
        const PATTERN = await Pattern.findOne({
            where: { name: { [Op.iLike]: "Borei" } },
            include: [ Pattern.associations.kois ]
        });
        expect(PATTERN).toBeDefined();
        expect(PATTERN.name).toBe("Borei");
        expect(PATTERN.type).toBe("Collector");
        expect(PATTERN.hatchTime).toBe(10);
        expect(PATTERN.kois).toBeDefined();
        expect(PATTERN.kois.length).toBe(32);

        let commons = [
            "Seishiro", "Seidai", "Seikuro", "Seiukon",
            "Kushiro", "Kudai", "Kukuro", "Kuukon",
            "Ryoshiro", "Ryodai", "Ryokuro", "Ryoukon",
            "Mushiro", "Mudai", "Mukuro", "Muukon"
        ];
        let rares = [
            "Seikatsu", "Seiusu", "Seiumi", "Seimura",
            "Kukatsu", "Kuusu", "Kuumi", "Kumura",
            "Ryokatsu", "Ryousu", "Ryoumi", "Ryomura",
            "Mukatsu", "Muusu", "Muumi", "Mumura"
        ];
        for (const KOI of PATTERN.kois)
        {
            expect(KOI.patternName).toBe("Borei");
            if (KOI.rarity == "Common")
            {
                expect(commons).toContain(KOI.name);
                commons.splice(commons.indexOf(KOI.name), 1);
            }
            if (KOI.rarity == "Rare")
            {
                expect(rares).toContain(KOI.name);
                rares.splice(rares.indexOf(KOI.name), 1);
            }
        }
    });

});

describe("Update patterns with a prepopulated database.", () => {
    
    beforeEach(async() => await dropAllTables());
    afterAll(async() => await dropAllTables());

    test("A pattern's hatch time is updated.", async() => {
        // insert Pattern that will be modified
        await Database.start();
        await Pattern.create({ name: "Suro", hatchTime: 99, type: "Collector" });
        await Database.stop();

        // update the Pattern
        await DataAccessLayer.start();
        await DataAccessLayer.updatePatterns();
        
        // confirm the pattern has been updated
        const PATTERN = await Pattern.findOne({where: { name: { [Op.iLike]: "Suro" } }});
        expect(PATTERN.hatchTime).toBe(10);
    });

    test("Does not add duplicates.", async() => {
        await DataAccessLayer.start();
        await DataAccessLayer.updatePatterns();

        const PATTERN_COUNT = await Pattern.count();
        const KOI_COUNT = await Koi.count();

        await DataAccessLayer.updatePatterns();

        const PATTERN_COUNT2 = await Pattern.count();
        const KOI_COUNT2 = await Koi.count();

        expect(PATTERN_COUNT2).toBe(PATTERN_COUNT);
        expect(KOI_COUNT2).toBe(KOI_COUNT);
    });

});

// ===================
// =====SAVE USER=====
// ===================

describe("Save user.", () => {

    beforeEach(async() => {
        await dropAllTables()
        await DataAccessLayer.start();
    });
    afterAll(async() => await dropAllTables());

    test("Spreadsheet ID is invalid.", async() => {
        await expectErrorAsync(
            DataAccessLayer.saveUser("somediscordid", "somename", "invalidspreadsheet"),
            SpreadsheetNotFound,
            "Spreadsheet ID 'invalidspreadsheet' does not exist."
        );
    });

    test("Spreadsheet is private.", async() => {
        await expectErrorAsync(
            DataAccessLayer.saveUser(
                "somediscordid", "somename", spreadsheets.private
            ),
            PrivateSpreadsheet,
            `Spreadsheet ID '${spreadsheets.private}' is private.`
        );
    });

    test("Saving user adds that user.", async() => {
        await DataAccessLayer
            .saveUser("somediscord", "somename", spreadsheets.community);
        const COUNT = await User.count();
        expect(COUNT).toBe(1);
        const USER = await User.findOne();
        expect(USER.discordId).toBe("somediscord");
        expect(USER.name).toBe("somename");
        expect(USER.spreadsheetId).toBe(spreadsheets.community);
    });

    test("Saving user updates that user's name.", async() => {
        await DataAccessLayer.saveUser("somediscord", "somename", spreadsheets.community);
        await DataAccessLayer.saveUser("somediscord", "newname", spreadsheets.community);
        const COUNT = await User.count();
        expect(COUNT).toBe(1);
        const USER = await User.findOne();
        expect(USER.discordId).toBe("somediscord");
        expect(USER.name).toBe("newname");
        expect(USER.spreadsheetId).toBe(spreadsheets.community);
    });

    test("Saving user updates that user's spreadsheet ID.", async() => {
        await DataAccessLayer
            .saveUser("somediscord", "somename", spreadsheets.community);
        await DataAccessLayer.saveUser("somediscord", "somename", spreadsheets.test);
        const COUNT = await User.count();
        expect(COUNT).toBe(1);
        const USER = await User.findOne();
        expect(USER.discordId).toBe("somediscord");
        expect(USER.name).toBe("somename");
        expect(USER.spreadsheetId).toBe(spreadsheets.test);
    });
});

// ===========================
// =====USERS MISSING KOI=====
// ===========================

describe("Get users missing koi.", () => {

    beforeAll(async() => {
        await dropAllTables();
        await DataAccessLayer.start();
        await DataAccessLayer.updatePatterns();
        await DataAccessLayer.saveUser(
            "did1", "name1", spreadsheets.test
        );
        await DataAccessLayer.saveUser(
            "did2", "name2", spreadsheets.formatBroken
        );
        await DataAccessLayer.stop();
    })
    beforeEach(async() => {
        await DataAccessLayer.start();
    });
    afterAll(async() => await dropAllTables());

    test("Pattern not found.", async() => {
        await expectErrorAsync(
            DataAccessLayer.getUsersMissingKoi("makuro", "invalidpattern"),
            PatternNotFound,
            "Pattern 'invalidpattern' does not exist."
        );
    });
    
    test("Koi not found.", async() => {
        await expectErrorAsync(
            DataAccessLayer.getUsersMissingKoi("invalidkoi", "botan"),
            KoiNotFound,
            "Pattern 'botan' does not have koi 'invalidkoi'."
        );
    });

    test("Get users missing common collector a-m.", async() => {
        const USERS_MISSING_KOI = 
            await DataAccessLayer.getUsersMissingKoi("aidai", "kiruto");
        expectUsersMissingKoi(
            USERS_MISSING_KOI,
            {
                discordIds: ["did1", "did2"],
                rarity: "Common",
                hatchTime: 10,
                discordIdsWithSpreadsheetErrors: {
                    patternNotFound: [],
                    koiNotFound: [],
                    formatBroken: [],
                    spreadsheetNotFound: [],
                    privateSpreadshet: []
                }
            }
        );
    });

    test("Get users missing rare collector a-m.", async() => {
        const USERS_MISSING_KOI = 
            await DataAccessLayer.getUsersMissingKoi("shimosu", "kirinu");
        expectUsersMissingKoi(
            USERS_MISSING_KOI,
            {
                discordIds: ["did1", "did2"],
                rarity: "Rare",
                hatchTime: 10,
                discordIdsWithSpreadsheetErrors: {
                    patternNotFound: [],
                    koiNotFound: [],
                    formatBroken: [],
                    spreadsheetNotFound: [],
                    privateSpreadshet: []
                }
            }
        );
    });


    test("Get users missing common collector n-z.", async() => {
        const USERS_MISSING_KOI = 
            await DataAccessLayer.getUsersMissingKoi("chashiro", "wanwan");
        expectUsersMissingKoi(
            USERS_MISSING_KOI,
            {
                discordIds: ["did1", "did2"],
                rarity: "Common",
                hatchTime: 10,
                discordIdsWithSpreadsheetErrors: {
                    patternNotFound: [],
                    koiNotFound: [],
                    formatBroken: [],
                    spreadsheetNotFound: [],
                    privateSpreadshet: []
                }
            }
        );
    });

    test("Get users missing rare collector a-m.", async() => {
        const USERS_MISSING_KOI = 
            await DataAccessLayer.getUsersMissingKoi("mapapu", "naisu");
        expectUsersMissingKoi(
            USERS_MISSING_KOI,
            {
                discordIds: ["did2"],
                rarity: "Rare",
                hatchTime: 11,
                discordIdsWithSpreadsheetErrors: {
                    patternNotFound: [],
                    koiNotFound: [],
                    formatBroken: [],
                    spreadsheetNotFound: [],
                    privateSpreadshet: []
                }
            }
        );
    });

    test("No one missing koi.", async() => {
        const USERS_MISSING_KOI = 
            await DataAccessLayer.getUsersMissingKoi("nedai", "kajitsu");
        expectUsersMissingKoi(
            USERS_MISSING_KOI,
            {
                discordIds: [],
                rarity: "Common",
                hatchTime: 10,
                discordIdsWithSpreadsheetErrors: {
                    patternNotFound: [],
                    koiNotFound: [],
                    formatBroken: [],
                    spreadsheetNotFound: [],
                    privateSpreadshet: []
                }
            }
        );
    });

    test("Pattern casing is ignored.", async() => {
        const USERS_MISSING_KOI = 
            await DataAccessLayer.getUsersMissingKoi("gumura", "oriito");
        expectUsersMissingKoi(
            USERS_MISSING_KOI,
            {
                discordIds: ["did1", "did2"],
                rarity: "Rare",
                hatchTime: 10,
                discordIdsWithSpreadsheetErrors: {
                    patternNotFound: [],
                    koiNotFound: [],
                    formatBroken: [],
                    spreadsheetNotFound: [],
                    privateSpreadshet: []
                }
            }
        );
    });

    test("Koi casing is ignored.", async() => {
        const USERS_MISSING_KOI = 
            await DataAccessLayer.getUsersMissingKoi("MAYUKI", "rabu");
        expectUsersMissingKoi(
            USERS_MISSING_KOI,
            {
                discordIds: ["did2"],
                rarity: "Common",
                hatchTime: 5,
                discordIdsWithSpreadsheetErrors: {
                    patternNotFound: [],
                    koiNotFound: [],
                    formatBroken: [],
                    spreadsheetNotFound: [],
                    privateSpreadshet: []
                }
            }
        );
    });

    test("Missing valid pattern in spreadsheet.", async() => {
        const USERS_MISSING_KOI = 
            await DataAccessLayer.getUsersMissingKoi("kucheri", "rozu");
        expectUsersMissingKoi(
            USERS_MISSING_KOI,
            {
                discordIds: ["did2"],
                rarity: "Rare",
                hatchTime: 10,
                discordIdsWithSpreadsheetErrors: {
                    patternNotFound: ["did1"],
                    koiNotFound: [],
                    formatBroken: [],
                    spreadsheetNotFound: [],
                    privateSpreadshet: []
                }
            }
        );
    });

    test("Koi typo in spreadsheet.", async() => {
        const USERS_MISSING_KOI = 
            await DataAccessLayer.getUsersMissingKoi("aoshiro", "hoseki");
        expectUsersMissingKoi(
            USERS_MISSING_KOI,
            {
                discordIds: ["did2"],
                rarity: "Common",
                hatchTime: 9,
                discordIdsWithSpreadsheetErrors: {
                    patternNotFound: [],
                    koiNotFound: ["did1"],
                    formatBroken: [],
                    spreadsheetNotFound: [],
                    privateSpreadshet: []
                }
            }
        );
    });

    test("Spreadsheet has an extra empty row.", async() => {
        const USERS_MISSING_KOI = 
            await DataAccessLayer.getUsersMissingKoi("mashiro", "mukei");
        expectUsersMissingKoi(
            USERS_MISSING_KOI,
            {
                discordIds: ["did1"],
                rarity: "Common",
                hatchTime: 10,
                discordIdsWithSpreadsheetErrors: {
                    patternNotFound: [],
                    koiNotFound: [],
                    formatBroken: ["did2"],
                    spreadsheetNotFound: [],
                    privateSpreadshet: []
                }
            }
        );
    });

    describe("Invalid spreadsheet.", () => {
        let user;
        afterEach(async() => await user.destroy());

        test("Spreadsheet is private.", async() => {
            user = await User.create({
                discordId: "did3", name: "name3", spreadsheetId: spreadsheets.private
            })
            const USERS_MISSING_KOI = 
                await DataAccessLayer.getUsersMissingKoi("mamido", "habu");
            expectUsersMissingKoi(
                USERS_MISSING_KOI,
                {
                    discordIds: ["did1", "did2"],
                    rarity: "Rare",
                    hatchTime: 5,
                    discordIdsWithSpreadsheetErrors: {
                        patternNotFound: [],
                        koiNotFound: [],
                        formatBroken: [],
                        spreadsheetNotFound: [],
                        privateSpreadshet: ["did3"]
                    }
                }
            );
        });

        test("Spreadsheet does not exist.", async() => {
            user = await User.create({
                discordId: "did3", name: "name3", spreadsheetId: "invalid"
            })
            const USERS_MISSING_KOI = 
                await DataAccessLayer.getUsersMissingKoi("mamido", "habu");
            expectUsersMissingKoi(
                USERS_MISSING_KOI,
                {
                    discordIds: ["did1", "did2"],
                    rarity: "Rare",
                    hatchTime: 5,
                    discordIdsWithSpreadsheetErrors: {
                        patternNotFound: [],
                        koiNotFound: [],
                        formatBroken: [],
                        spreadsheetNotFound: ["did3"],
                        privateSpreadshet: []
                    }
                }
            );
        });
    });

    describe("Invalid Google API key.", () => {
        const ORIGINAL_ENV = process.env;
        beforeAll(() => process.env = { ...ORIGINAL_ENV });
        afterAll(() => process.env = { ...ORIGINAL_ENV });

        test("Error with invalid Google Api key.", async() => {
            process.env.GOOGLE_API_KEY = "invalid";
            await expect(DataAccessLayer.getUsersMissingKoi("ryoshiro", "uoza"))
                .rejects.toThrow(InvalidGoogleApiKey);
        })
    });

    describe("Modify pattern.", () => {

        let pattern;
        let originalHatchTime;
        beforeEach(async() => {
            pattern = await Pattern.findOne({
                where: { name: { [Op.iLike]: "yanone" } }
            });
            originalHatchTime = pattern.hatchTime;
            pattern.hatchTime = null;
            await pattern.save();
        });
        afterEach(async() => {
            pattern.hatchTime = originalHatchTime;
            await pattern.save();
        });

        test("No hatch time.", async() => {            
            const USERS_MISSING_KOI = 
                await DataAccessLayer.getUsersMissingKoi("negin", "yanone");
            expectUsersMissingKoi(
                USERS_MISSING_KOI,
                {
                    discordIds: ["did1"],
                    rarity: "Common",
                    hatchTime: undefined,
                    discordIdsWithSpreadsheetErrors: {
                        patternNotFound: [],
                        koiNotFound: [],
                        formatBroken: [],
                        spreadsheetNotFound: [],
                        privateSpreadshet: []
                    }
                }
            );
        });
    });

    function expectUsersMissingKoi(received, expected)
    {
        expectList(received.discordIds, expected.discordIds)
        expect(received.rarity).toBe(expected.rarity);
        expect(received.hatchTime).toBe(expected.hatchTime);
        expectList(
            received.discordIdsWithSpreadsheetErrors.patternNotFound, 
            expected.discordIdsWithSpreadsheetErrors.patternNotFound
        );
        expectList(
            received.discordIdsWithSpreadsheetErrors.koiNotFound, 
            expected.discordIdsWithSpreadsheetErrors.koiNotFound
        );
        expectList(
            received.discordIdsWithSpreadsheetErrors.formatBroken, 
            expected.discordIdsWithSpreadsheetErrors.formatBroken
        );
        expectList(
            received.discordIdsWithSpreadsheetErrors.spreadsheetNotFound, 
            expected.discordIdsWithSpreadsheetErrors.spreadsheetNotFound
        );
    }

    function expectList(receivedList, expectedList)
    {
        expect(receivedList.length).toBe(expectedList.length);
        for (const EXPECTED_ITEM of expectedList)
        {
            expect(receivedList).toContain(EXPECTED_ITEM);
        }
    }

});