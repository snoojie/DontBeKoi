const { CommunitySpreadsheet } = require("../../src/google/communitySpreadsheet");
const { waitGoogleQuota, googleQuotaTimeout, testWithModifiedEnv } 
    = require("../_setup/spreadsheet");

// wait a minute before starting the tests
// this is because google has a read quota
/*beforeAll(async() => {
    await waitGoogleQuota();
}, googleQuotaTimeout);*/

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

    test("Collector kubiwa is correct.", () => {
        const PATTERN = patterns.find(pattern => pattern.name == "Kubiwa");
        expect(PATTERN).toBeDefined();
        expect(PATTERN.name).toBe("Kubiwa");
        expect(PATTERN.type).toBe("Collector");
        expect(PATTERN.hatchTime).toBe(6);
        expect(PATTERN.kois.length).toBe(32);
        expect(PATTERN.kois).toContainEqual({ name: "Choshiro", rarity: "Common" });
        expect(PATTERN.kois).toContainEqual({ name: "Chogure", rarity: "Common" });
        expect(PATTERN.kois).toContainEqual({ name: "Choukon", rarity: "Common" });
        expect(PATTERN.kois).toContainEqual({ name: "Chomarun", rarity: "Common" });
        expect(PATTERN.kois).toContainEqual({ name: "Neshiro", rarity: "Common" });
        expect(PATTERN.kois).toContainEqual({ name: "Negure", rarity: "Common" });
        expect(PATTERN.kois).toContainEqual({ name: "Neukon", rarity: "Common" });
        expect(PATTERN.kois).toContainEqual({ name: "Nemarun", rarity: "Common" });
        expect(PATTERN.kois).toContainEqual({ name: "Mashiro", rarity: "Common" });
        expect(PATTERN.kois).toContainEqual({ name: "Magure", rarity: "Common" });
        expect(PATTERN.kois).toContainEqual({ name: "Maukon", rarity: "Common" });
        expect(PATTERN.kois).toContainEqual({ name: "Mamarun", rarity: "Common" });
        expect(PATTERN.kois).toContainEqual({ name: "Seishiro", rarity: "Common" });
        expect(PATTERN.kois).toContainEqual({ name: "Seigure", rarity: "Common" });
        expect(PATTERN.kois).toContainEqual({ name: "Seiukon", rarity: "Common" });
        expect(PATTERN.kois).toContainEqual({ name: "Seimarun", rarity: "Common" });
        expect(PATTERN.kois).toContainEqual({ name: "Chousu", rarity: "Rare" });
        expect(PATTERN.kois).toContainEqual({ name: "Chomido", rarity: "Rare" });
        expect(PATTERN.kois).toContainEqual({ name: "Chokatsu", rarity: "Rare" });
        expect(PATTERN.kois).toContainEqual({ name: "Chopinku", rarity: "Rare" });
        expect(PATTERN.kois).toContainEqual({ name: "Neusu", rarity: "Rare" });
        expect(PATTERN.kois).toContainEqual({ name: "Nemido", rarity: "Rare" });
        expect(PATTERN.kois).toContainEqual({ name: "Nekatsu", rarity: "Rare" });
        expect(PATTERN.kois).toContainEqual({ name: "Nepinku", rarity: "Rare" });
        expect(PATTERN.kois).toContainEqual({ name: "Mausu", rarity: "Rare" });
        expect(PATTERN.kois).toContainEqual({ name: "Mamido", rarity: "Rare" });
        expect(PATTERN.kois).toContainEqual({ name: "Makatsu", rarity: "Rare" });
        expect(PATTERN.kois).toContainEqual({ name: "Mapinku", rarity: "Rare" });
        expect(PATTERN.kois).toContainEqual({ name: "Seiusu", rarity: "Rare" });
        expect(PATTERN.kois).toContainEqual({ name: "Seimido", rarity: "Rare" });
        expect(PATTERN.kois).toContainEqual({ name: "Seikatsu", rarity: "Rare" });
        expect(PATTERN.kois).toContainEqual({ name: "Seipinku", rarity: "Rare" });
    });

    test("Progressive ogon is correct.", () => {
        const PATTERN = patterns.find(pattern => pattern.name == "Ogon");
        expect(PATTERN).toBeDefined();
        expect(PATTERN.name).toBe("Ogon");
        expect(PATTERN.type).toBe("Progressive");
        expect(PATTERN.hatchTime).not.toBeDefined();
        expect(PATTERN.kois.length).toBe(32);
        expect(PATTERN.kois).toContainEqual({ name: "Shishiro", rarity: "Common" });
        expect(PATTERN.kois).toContainEqual({ name: "Shiukon", rarity: "Common" });
        expect(PATTERN.kois).toContainEqual({ name: "Shidai", rarity: "Common" });
        expect(PATTERN.kois).toContainEqual({ name: "Shikuro", rarity: "Common" });
        expect(PATTERN.kois).toContainEqual({ name: "Kishiro", rarity: "Common" });
        expect(PATTERN.kois).toContainEqual({ name: "Kiukon", rarity: "Common" });
        expect(PATTERN.kois).toContainEqual({ name: "Kidai", rarity: "Common" });
        expect(PATTERN.kois).toContainEqual({ name: "Kikuro", rarity: "Common" });
        expect(PATTERN.kois).toContainEqual({ name: "Akashiro", rarity: "Common" });
        expect(PATTERN.kois).toContainEqual({ name: "Akaukon", rarity: "Common" });
        expect(PATTERN.kois).toContainEqual({ name: "Akadai", rarity: "Common" });
        expect(PATTERN.kois).toContainEqual({ name: "Akakuro", rarity: "Common" });
        expect(PATTERN.kois).toContainEqual({ name: "Kushiro", rarity: "Common" });
        expect(PATTERN.kois).toContainEqual({ name: "Kuukon", rarity: "Common" });
        expect(PATTERN.kois).toContainEqual({ name: "Kudai", rarity: "Common" });
        expect(PATTERN.kois).toContainEqual({ name: "Kukuro", rarity: "Common" });
        expect(PATTERN.kois).toContainEqual({ name: "Shipinku", rarity: "Rare" });
        expect(PATTERN.kois).toContainEqual({ name: "Shimura", rarity: "Rare" });
        expect(PATTERN.kois).toContainEqual({ name: "Shimido", rarity: "Rare" });
        expect(PATTERN.kois).toContainEqual({ name: "Shiburu", rarity: "Rare" });
        expect(PATTERN.kois).toContainEqual({ name: "Kipinku", rarity: "Rare" });
        expect(PATTERN.kois).toContainEqual({ name: "Kimura", rarity: "Rare" });
        expect(PATTERN.kois).toContainEqual({ name: "Kimido", rarity: "Rare" });
        expect(PATTERN.kois).toContainEqual({ name: "Kiburu", rarity: "Rare" });
        expect(PATTERN.kois).toContainEqual({ name: "Akapinku", rarity: "Rare" });
        expect(PATTERN.kois).toContainEqual({ name: "Akamura", rarity: "Rare" });
        expect(PATTERN.kois).toContainEqual({ name: "Akamido", rarity: "Rare" });
        expect(PATTERN.kois).toContainEqual({ name: "Akaburu", rarity: "Rare" });
        expect(PATTERN.kois).toContainEqual({ name: "Kupinku", rarity: "Rare" });
        expect(PATTERN.kois).toContainEqual({ name: "Kumura", rarity: "Rare" });
        expect(PATTERN.kois).toContainEqual({ name: "Kumido", rarity: "Rare" });
        expect(PATTERN.kois).toContainEqual({ name: "Kuburu", rarity: "Rare" });
    });

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