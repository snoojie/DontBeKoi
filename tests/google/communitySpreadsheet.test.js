const { CommunitySpreadsheet } = require("../../src/spreadsheets/communitySpreadsheet");
const { Progress } = require("../../src/spreadsheets/koiSpreadsheet");
const { waitGoogleQuota, googleQuotaTimeout, testWithModifiedEnv } 
    = require("../_setup/spreadsheet");

// wait a minute before starting the tests
// this is because google has a read quota
beforeAll(async() => {
    await waitGoogleQuota();
}, googleQuotaTimeout);

testWithModifiedEnv("Get all patterns", CommunitySpreadsheet.getAllPatterns);

describe("Get all patterns before tests.", () => {

    let patterns;
    beforeAll(async() => patterns = await CommunitySpreadsheet.getAllPatterns());

    // ======================
    // =====PATTERN TYPE=====
    // ======================

    test("Has 30 progressives.", () => {
        const COUNT = count(patterns, (pattern) => pattern.type == "Progressive");
        expect(COUNT).toBe(30);
    });
    
    test("Has at least 204 collectors.", () => {
        const COUNT = count(patterns, (pattern) => pattern.type == "Collector");
        expect(COUNT).toBeGreaterThanOrEqual(204);
    });

    test("Type is either Progressive or Collector.", () => {
        for (const PATTERN of patterns.values())
        {
            expect(PATTERN.type == "Progressive" || PATTERN.type == "Collector")
                .toBeTruthy()
        }
    });

    // =====================
    // =====KOI RARITY=====
    // =====================

    test("Each pattern has 16 common kois.", () => {
        for (const PATTERN of patterns.values())
        {
            const COUNT = count(PATTERN.kois, koi => koi.rarity == "Common");
            expect(COUNT).toBe(16);
        }
    });

    test("Each pattern has 16 rare kois.", () => {
        for (const PATTERN of patterns.values())
        {
            const COUNT = count(PATTERN.kois, koi => koi.rarity == "Rare");
            expect(COUNT).toBe(16);
        }
    });

    test("Each pattern has 32 kois.", () => {
        for (const PATTERN of patterns.values())
        {
            expect(PATTERN.kois.size).toBe(32);
        }
    });

    // ====================
    // =====HATCH TIME=====
    // ====================

    test("All collectors have a hatch time.", () => {
        for (const PATTERN of patterns.values())
        {
            if (PATTERN.type == "Collector")
            {
                expect(PATTERN.hatchTime).toBeDefined();
                expect(PATTERN.hatchTime).toBeGreaterThan(1);
            }
        }
    });

    test("No progressive has a hatch time.", () => {
        for (const PATTERN of patterns.values())
        {
            if (PATTERN.type == "Progressive")
            {
                expect(PATTERN.hatchTime).not.toBeDefined();
            }
        }
    });

    // ==================
    // =====PROGRESS=====
    // ==================

    test("No patterns are collected.", () => {
        for (const PATTERN of patterns.values())
        {
            for (const KOI of PATTERN.kois.values())
            {
                expect(KOI.progress).toBe(Progress.NOT_YET_COLLECTED);
            }
        }
    });

    // ==========================================
    // =====ALL VALUES OF A SPECIFIC PATTERN=====
    // ==========================================

    test("Collector kubiwa is correct.", () => {
        const PATTERN = patterns.get("Kubiwa");
        expect(PATTERN).toBeDefined();
        expect(PATTERN.type).toBe("Collector");
        expect(PATTERN.hatchTime).toBe(6);
        expect(PATTERN.kois.size).toBe(32);
        expectKoi(PATTERN, "Choshiro", "Common");
        expectKoi(PATTERN, "Chogure", "Common");
        expectKoi(PATTERN, "Choukon", "Common");
        expectKoi(PATTERN, "Chomarun", "Common");
        expectKoi(PATTERN, "Neshiro", "Common");
        expectKoi(PATTERN, "Negure", "Common");
        expectKoi(PATTERN, "Neukon", "Common");
        expectKoi(PATTERN, "Nemarun", "Common");
        expectKoi(PATTERN, "Mashiro", "Common");
        expectKoi(PATTERN, "Magure", "Common");
        expectKoi(PATTERN, "Maukon", "Common");
        expectKoi(PATTERN, "Mamarun", "Common");
        expectKoi(PATTERN, "Seishiro", "Common");
        expectKoi(PATTERN, "Seigure", "Common");
        expectKoi(PATTERN, "Seiukon", "Common");
        expectKoi(PATTERN, "Seimarun", "Common");
        expectKoi(PATTERN, "Chousu", "Rare");
        expectKoi(PATTERN, "Chomido", "Rare");
        expectKoi(PATTERN, "Chokatsu", "Rare");
        expectKoi(PATTERN, "Chopinku", "Rare");
        expectKoi(PATTERN, "Neusu", "Rare");
        expectKoi(PATTERN, "Nemido", "Rare");
        expectKoi(PATTERN, "Nekatsu", "Rare");
        expectKoi(PATTERN, "Nepinku", "Rare");
        expectKoi(PATTERN, "Mausu", "Rare");
        expectKoi(PATTERN, "Mamido", "Rare");
        expectKoi(PATTERN, "Makatsu", "Rare");
        expectKoi(PATTERN, "Mapinku", "Rare");
        expectKoi(PATTERN, "Seiusu", "Rare");
        expectKoi(PATTERN, "Seimido", "Rare");
        expectKoi(PATTERN, "Seikatsu", "Rare");
        expectKoi(PATTERN, "Seipinku", "Rare");
    });

    test("Progressive ogon is correct.", () => {
        const PATTERN = patterns.get("Ogon");
        expect(PATTERN).toBeDefined();
        expect(PATTERN.type).toBe("Progressive");
        expect(PATTERN.hatchTime).not.toBeDefined();
        expect(PATTERN.kois.size).toBe(32);
        expectKoi(PATTERN, "Shishiro", "Common");
        expectKoi(PATTERN, "Shiukon", "Common");
        expectKoi(PATTERN, "Shidai", "Common");
        expectKoi(PATTERN, "Shikuro", "Common");
        expectKoi(PATTERN, "Kishiro", "Common");
        expectKoi(PATTERN, "Kiukon", "Common");
        expectKoi(PATTERN, "Kidai", "Common");
        expectKoi(PATTERN, "Kikuro", "Common");
        expectKoi(PATTERN, "Akashiro", "Common");
        expectKoi(PATTERN, "Akaukon", "Common");
        expectKoi(PATTERN, "Akadai", "Common");
        expectKoi(PATTERN, "Akakuro", "Common");
        expectKoi(PATTERN, "Kushiro", "Common");
        expectKoi(PATTERN, "Kuukon", "Common");
        expectKoi(PATTERN, "Kudai", "Common");
        expectKoi(PATTERN, "Kukuro", "Common");
        expectKoi(PATTERN, "Shipinku", "Rare");
        expectKoi(PATTERN, "Shimura", "Rare");
        expectKoi(PATTERN, "Shimido", "Rare");
        expectKoi(PATTERN, "Shiburu", "Rare");
        expectKoi(PATTERN, "Kipinku", "Rare");
        expectKoi(PATTERN, "Kimura", "Rare");
        expectKoi(PATTERN, "Kimido", "Rare");
        expectKoi(PATTERN, "Kiburu", "Rare");
        expectKoi(PATTERN, "Akapinku", "Rare");
        expectKoi(PATTERN, "Akamura", "Rare");
        expectKoi(PATTERN, "Akamido", "Rare");
        expectKoi(PATTERN, "Akaburu", "Rare");
        expectKoi(PATTERN, "Kupinku", "Rare");
        expectKoi(PATTERN, "Kumura", "Rare");
        expectKoi(PATTERN, "Kumido", "Rare");
        expectKoi(PATTERN, "Kuburu", "Rare");
    });

    function expectKoi(pattern, koiName, rarity)
    {
        const KOI = pattern.kois.get(koiName);
        expect(KOI).toBeDefined();
        expect(KOI.rarity).toBe(rarity);
        expect(KOI.progress).toBe(Progress.NOT_YET_COLLECTED);
    }

    function count(map, include)
    {
        let count = 0;
        for (const ITEM of map.values())
        {
            if (include(ITEM))
            {
                count++;
            }
        }
        return count;
    }

});