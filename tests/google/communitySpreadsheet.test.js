const { CommunitySpreadsheet } = require("../../src/google/communitySpreadsheet");
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
    
    test("Has at least 203 collectors.", () => {
        const COUNT = count(patterns, (pattern) => pattern.type == "Collector");
        expect(COUNT).toBeGreaterThanOrEqual(203);
    });

    test("Type is either Progressive or Collector.", () => {
        for (const PATTERN of patterns)
        {
            expect(PATTERN.type == "Progressive" || PATTERN.type == "Collector")
                .toBeTruthy()
        }
    });

    // =====================
    // =====KOI RARITY=====
    // =====================

    test("Each pattern has 16 common kois.", () => {
        for (const PATTERN of patterns)
        {
            const COUNT = count(PATTERN.kois, koi => koi.rarity == "Common");
            expect(COUNT).toBe(16);
        }
    });

    test("Each pattern has 16 rare kois.", () => {
        for (const PATTERN of patterns)
        {
            const COUNT = count(PATTERN.kois, koi => koi.rarity == "Rare");
            expect(COUNT).toBe(16);
        }
    });

    test("Each pattern has 32 kois.", () => {
        for (const PATTERN of patterns)
        {
            expect(PATTERN.kois.length).toBe(32);
        }
    });

    // ====================
    // =====HATCH TIME=====
    // ====================

    test("All collectors have a hatch time.", () => {
        for (const PATTERN of patterns)
        {
            if (PATTERN.type == "Collector")
            {
                expect(PATTERN.hatchTime).toBeDefined();
                expect(PATTERN.hatchTime).toBeGreaterThan(1);
            }
        }
    });

    test("No progressive has a hatch time.", () => {
        for (const PATTERN of patterns)
        {
            if (PATTERN.type == "Progressive")
            {
                expect(PATTERN.hatchTime).not.toBeDefined();
            }
        }
    });

    // ==========================================
    // =====ALL VALUES OF A SPECIFIC PATTERN=====
    // ==========================================
/*
    test("Collector kubiwa is correct.", () => {
        let pattern = patterns.find(pattern => pattern.name == "Kubiwa");
        expect(pattern).toEqual({
            name: "Kubiwa",
            type: "Collector",
            hatchTime: 6,
            kois: [
                { name: "Choshiro", rarity: "Common" },
                { name: "Chogure", rarity: "Common" },
                { name: "Choukon", rarity: "Common" },
                { name: "Chomarun", rarity: "Common" },
                { name: "Neshiro", rarity: "Common" },
                { name: "Negure", rarity: "Common" },
                { name: "Neukon", rarity: "Common" },
                { name: "Nemarun", rarity: "Common" },
                { name: "Mashiro", rarity: "Common" },
                { name: "Magure", rarity: "Common" },
                { name: "Maukon", rarity: "Common" },
                { name: "Mamarun", rarity: "Common" },
                { name: "Seishiro", rarity: "Common" },
                { name: "Seigure", rarity: "Common" },
                { name: "Seiukon", rarity: "Common" },
                { name: "Seimarun", rarity: "Common" },
                { name: "Chousu", rarity: "Rare" },
                { name: "Chomido", rarity: "Rare" },
                { name: "Chokatsu", rarity: "Rare" },
                { name: "Chopinku", rarity: "Rare" },
                { name: "Neusu", rarity: "Rare" },
                { name: "Nemido", rarity: "Rare" },
                { name: "Nekatsu", rarity: "Rare" },
                { name: "Nepinku", rarity: "Rare" },
                { name: "Mausu", rarity: "Rare" },
                { name: "Mamido", rarity: "Rare" },
                { name: "Makatsu", rarity: "Rare" },
                { name: "Mapinku", rarity: "Rare" },
                { name: "Seiusu", rarity: "Rare" },
                { name: "Seimido", rarity: "Rare" },
                { name: "Seikatsu", rarity: "Rare" },
                { name: "Seipinku", rarity: "Rare" },
            ]
        });
    });

    test("Progressive ogon is correct.", () => {
        let pattern = patterns.find(pattern => pattern.name == "Ogon");
        expect(pattern).toEqual({
            name: "Ogon",
            type: "Progressive",
            kois: [
                { name: "Shishiro", rarity: "Common" },
                { name: "Shiukon", rarity: "Common" },
                { name: "Shidai", rarity: "Common" },
                { name: "Shikuro", rarity: "Common" },
                { name: "Kishiro", rarity: "Common" },
                { name: "Kiukon", rarity: "Common" },
                { name: "Kidai", rarity: "Common" },
                { name: "Kikuro", rarity: "Common" },
                { name: "Akashiro", rarity: "Common" },
                { name: "Akaukon", rarity: "Common" },
                { name: "Akadai", rarity: "Common" },
                { name: "Akakuro", rarity: "Common" },
                { name: "Kushiro", rarity: "Common" },
                { name: "Kuukon", rarity: "Common" },
                { name: "Kudai", rarity: "Common" },
                { name: "Kukuro", rarity: "Common" },
                { name: "Shipinku", rarity: "Rare" },
                { name: "Shimura", rarity: "Rare" },
                { name: "Shimido", rarity: "Rare" },
                { name: "Shiburu", rarity: "Rare" },
                { name: "Kipinku", rarity: "Rare" },
                { name: "Kimura", rarity: "Rare" },
                { name: "Kimido", rarity: "Rare" },
                { name: "Kiburu", rarity: "Rare" },
                { name: "Akapinku", rarity: "Rare" },
                { name: "Akamura", rarity: "Rare" },
                { name: "Akamido", rarity: "Rare" },
                { name: "Akaburu", rarity: "Rare" },
                { name: "Kupinku", rarity: "Rare" },
                { name: "Kumura", rarity: "Rare" },
                { name: "Kumido", rarity: "Rare" },
                { name: "Kuburu", rarity: "Rare" },
            ]
        });
    });
*/
    function count(list, include)
    {
        let count = 0;
        for (const ITEM of list)
        {
            if (include(ITEM))
            {
                count++;
            }
        }
        return count;
    }

});