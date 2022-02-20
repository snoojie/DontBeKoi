const { DataAccessLayer, DataAccessLayerError } = require("../src/dataAccessLayer");
const { Database, DatabaseAlreadyRunning, InvalidDatabaseUrl } = require("../src/database/database");
const { dropAllTables } = require("./_setup/database");
const { Pattern } = require("../src/database/models/pattern");
const { Koi } = require("../src/database/models/koi");
const { Op } = require("sequelize");

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

    test("Can update patterns several times.", async() => {
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