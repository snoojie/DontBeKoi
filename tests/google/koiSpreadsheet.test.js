const { KoiSpreadsheet, Progress } = require("../../src/google/koiSpreadsheet");
const { waitGoogleQuota, googleQuotaTimeout, spreadsheets, testWithModifiedEnv, 
        expectPrivateSpreadsheet, expectSpreadsheetNotFound, expectRangeNotFound, 
        expectUnknownKoiProgress, expectKoiSpreadsheetMissingPattern, 
        expectKoiSpreadsheetMissingColor } = require("../_setup/spreadsheet");

// wait a minute before starting the tests
// this is because google has a read quota
beforeAll(async() => {
    await waitGoogleQuota();
}, googleQuotaTimeout);

// ===================
// =====GET VALUE=====
// ===================

test("Get value when provided a single cell.", () => {
    const VALUE = KoiSpreadsheet.getValue([ [ "cafe" ] ], 0, 0);
    expect(VALUE).toBe("cafe");
});

test("Get value removes accents.", () => {
    const VALUE = KoiSpreadsheet.getValue([ [ "café" ] ], 0, 0);
    expect(VALUE).toBe("cafe");
});

test("Get value of an empty string.", () => {
    const VALUE = KoiSpreadsheet.getValue([ [ "" ] ], 0, 0);
    expect(VALUE).toBe("");
});

test("Get value when provided several rows and columns.", () => {
    const VALUE = KoiSpreadsheet.getValue(
        [ [ "", "", "not it" ], [ "", "", "Jalapeños are delicious!" ] ], 
        1, 2
    );
    expect(VALUE).toBe("Jalapenos are delicious!");
});

test("Get value when rowIndex out of bounds.", () => {
    const VALUE = KoiSpreadsheet.getValue([ [ "not it" ] ], 3, 0);
    expect(VALUE).toBe("");
});

test("Get value when columnIndex out of bounds.", () => {
    const VALUE = KoiSpreadsheet.getValue([ [ "not it" ] ], 0, 3);
    expect(VALUE).toBe("");
});

test("Get value when table is empty.", () => {
    const VALUE = KoiSpreadsheet.getValue([], 0, 0);
    expect(VALUE).toBe("");
});

// ==========================
// =====GET PROGRESSIVES=====
// ==========================

testCommonCases("getProgressives");

describe("Validate progressives.", () => {

    let progressives;
    beforeAll(async() => 
        progressives = await KoiSpreadsheet.getProgressives(spreadsheets.valid2)
    );

    test("There are 30 progressives.", () => {
        expect(progressives.size).toBe(30);
    });

    test("Validate progressive Inazuma.", () => {
        const PROGRESSIVE = progressives.get("Inazuma");
        expect(PROGRESSIVE).toBeDefined();
        expect(PROGRESSIVE.type).toBe("Progressive");
        expectKoi(PROGRESSIVE, "Shishiro", "Common", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Shiukon", "Common", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Shidai", "Common", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Shikuro", "Common", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Kishiro", "Common", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Kiukon", "Common", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Kidai", "Common", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Kikuro", "Common", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Akashiro", "Common", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Akaukon", "Common", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Akadai", "Common", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Akakuro", "Common", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Kushiro", "Common", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Kuukon", "Common", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Kudai", "Common", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Kukuro", "Common", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Shipinku", "Rare", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Shimura", "Rare", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Shimido", "Rare", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Shiburu", "Rare", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Kipinku", "Rare", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Kimura", "Rare", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Kimido", "Rare", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Kiburu", "Rare", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Akapinku", "Rare", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Akamura", "Rare", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Akamido", "Rare", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Akaburu", "Rare", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Kupinku", "Rare", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Akamura", "Rare", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Akamido", "Rare", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Akaburu", "Rare", Progress.DRAGON_IN_COLLECTION);
    });

    test("Validate progressive Kujaku.", () => {
        const PROGRESSIVE = progressives.get("Kujaku");
        expect(PROGRESSIVE).toBeDefined();
        expect(PROGRESSIVE.type).toBe("Progressive");
        expectKoi(PROGRESSIVE, "Shishiro", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Shiukon", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Shidai", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Shikuro", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Kishiro", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Kiukon", "Common", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Kidai", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Kikuro", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Akashiro", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Akaukon", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Akadai", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Akakuro", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Kushiro", "Common", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Kuukon", "Common", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Kudai", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Kukuro", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Shipinku", "Rare", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Shimura", "Rare", Progress.KOI_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Shimido", "Rare", Progress.NOT_YET_COLLECTED);
        expectKoi(PROGRESSIVE, "Shiburu", "Rare", Progress.KOI_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Kipinku", "Rare", Progress.NOT_YET_COLLECTED);
        expectKoi(PROGRESSIVE, "Kimura", "Rare", Progress.DRAGON_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Kimido", "Rare", Progress.NOT_YET_COLLECTED);
        expectKoi(PROGRESSIVE, "Kiburu", "Rare", Progress.NOT_YET_COLLECTED);
        expectKoi(PROGRESSIVE, "Akapinku", "Rare", Progress.KOI_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Akamura", "Rare", Progress.KOI_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Akamido", "Rare", Progress.KOI_IN_COLLECTION);
        expectKoi(PROGRESSIVE, "Akaburu", "Rare", Progress.NOT_YET_COLLECTED);
        expectKoi(PROGRESSIVE, "Kupinku", "Rare", Progress.NOT_YET_COLLECTED);
        expectKoi(PROGRESSIVE, "Kumura", "Rare", Progress.NOT_YET_COLLECTED);
        expectKoi(PROGRESSIVE, "Kumido", "Rare", Progress.NOT_YET_COLLECTED);
        expectKoi(PROGRESSIVE, "Kuburu", "Rare", Progress.KOI_IN_COLLECTION);
    });
});

describe("Get progressives when koi progresses are bad form but valid.", () => {

    let progressives;
    beforeAll(async() => progressives = 
        await KoiSpreadsheet.getProgressives(spreadsheets.badButValidKoiProgress)
    );

    test("Progress marked with capital K.", () => {
        expect(progressives.get("Inazuma").kois.get("Shishiro").progress)
            .toBe(Progress.KOI_IN_COLLECTION);
    });

    test("Progress marked with capital D.", () => {
        expect(progressives.get("Goromo").kois.get("Kiburu").progress)
            .toBe(Progress.DRAGON_IN_COLLECTION);
    });

    test("Progress marked with k with extra white space.", () => {
        expect(progressives.get("Katame").kois.get("Kiukon").progress)
            .toBe(Progress.KOI_IN_COLLECTION);
    });

    test("Progress marked with D with extra white space.", () => {
        expect(progressives.get("Katame").kois.get("Akaukon").progress)
            .toBe(Progress.DRAGON_IN_COLLECTION);
    });

    test("Progress marked with white space.", () => {
        expect(progressives.get("Shizuku").kois.get("Kipinku").progress)
            .toBe(Progress.NOT_YET_COLLECTED);
    });
});

describe("Get progressives when color names are missing dashes.", () => {

    let progressives;
    beforeAll(async() => progressives = 
        await KoiSpreadsheet.getProgressives(spreadsheets.colorsMissingDashes)
    );

    test("Base color does not have a dash.", async() => {
        expectPatternHasKois(
            progressives, "Inazuma", ["Akashiro", "Akaukon", "Akadai", "Akakuro"]
        );
    });

    test("Common highlight color does not have a dash.", async() => {
        expectPatternHasKois(
            progressives, "Goromo", ["Shikuro", "Kikuro", "Akakuro", "Kukuro"]
        );
    });

    test("Rare highlight color does not have a dash.", async() => {
        expectPatternHasKois(
            progressives, "Kujaku", ["Shimura", "Kimura", "Akamura", "Kumura"]
        );
    });

});

test("Get progressives when koi progress is unknown.", async() => {
    await expectUnknownKoiProgress(
        KoiSpreadsheet.getProgressives(spreadsheets.invalidKoiProgress),
        spreadsheets.invalidKoiProgress, 
        "Progressive", 
        "Kudai", 
        "Toraiu", 
        "invalid"
    );
});

test("Get progressives when a pattern name is missing.", async() => {
    await expectKoiSpreadsheetMissingPattern(
        KoiSpreadsheet.getProgressives(spreadsheets.missingPatternNames),
        spreadsheets.missingPatternNames,
        "Progressives", 
        23, 
        "AE"
    );
});

test("Get progressives when pattern missing a base color.", async() => {
    await expectKoiSpreadsheetMissingColor(
        KoiSpreadsheet.getProgressives(spreadsheets.missingBaseColors),
        spreadsheets.missingBaseColors,
        "Progressive", 
        "Goromo", 
        11, 
        "T"
    );
});

test("Get progressives when pattern missing a highlight color.", async() => {
    await expectKoiSpreadsheetMissingColor(
        KoiSpreadsheet.getProgressives(spreadsheets.missingHighlightColors), 
        spreadsheets.missingHighlightColors,
        "Progressive", 
        "Meisai", 
        52, 
        "R"
    );
});

// ============================
// =====GET COLLECTORS A-M=====
// ============================

testCommonCases("getCollectorsAM");

describe("Validate collectors A-M.", () => {

    let collectors;
    beforeAll(async() => 
        collectors = await KoiSpreadsheet.getCollectorsAM(spreadsheets.valid2)
    );

    test("There are at least 112 collectors A-M.", () => {
        expect(collectors.size).toBeGreaterThanOrEqual(112);
    });

    test("Validate collector Menfisu.", () => {
        const COLLECTOR = collectors.get("Menfisu");
        expect(COLLECTOR).toBeDefined();
        expect(COLLECTOR.type).toBe("Collector");
        expectKoi(COLLECTOR, "Shidai", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(COLLECTOR, "Shikoji", "Common", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Shiiero", "Common", Progress.DRAGON_IN_COLLECTION);
        expectKoi(COLLECTOR, "Shisairo", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(COLLECTOR, "Kudai", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(COLLECTOR, "Kukoji", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(COLLECTOR, "Kuiero", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(COLLECTOR, "Kusairo", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(COLLECTOR, "Madai", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(COLLECTOR, "Makoji", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(COLLECTOR, "Maiero", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(COLLECTOR, "Masairo", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(COLLECTOR, "Aidai", "Common", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Aikoji", "Common", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Aiiero", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(COLLECTOR, "Aisairo", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(COLLECTOR, "Shiburu", "Rare", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Shimura", "Rare", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Shimaze", "Rare", Progress.KOI_IN_COLLECTION);
        expectKoi(COLLECTOR, "Shimido", "Rare", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Kuburu", "Rare", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Kumura", "Rare", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Kumaze", "Rare", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Kumido", "Rare", Progress.KOI_IN_COLLECTION);
        expectKoi(COLLECTOR, "Maburu", "Rare", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Mamura", "Rare", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Mamaze", "Rare", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Mamido", "Rare", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Aiburu", "Rare", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Aimura", "Rare", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Aimaze", "Rare", Progress.DRAGON_IN_COLLECTION);
        expectKoi(COLLECTOR, "Aimido", "Rare", Progress.NOT_YET_COLLECTED);
    });
});

describe("Get collectors A-M when koi progresses are bad form but valid.", () => {

    let collectors;
    beforeAll(async() => collectors = 
        await KoiSpreadsheet.getCollectorsAM(spreadsheets.badButValidKoiProgress)
    );

    test("Progress marked with capital K.", () => {
        expect(collectors.get("Akachan").kois.get("Ryosumi").progress)
            .toBe(Progress.KOI_IN_COLLECTION);
    });

    test("Progress marked with capital D.", () => {
        expect(collectors.get("Akachan").kois.get("Aisumi").progress)
            .toBe(Progress.DRAGON_IN_COLLECTION);
    });

    test("Progress marked with K with extra white space.", () => {
        expect(collectors.get("Akachan").kois.get("Kuukon").progress)
            .toBe(Progress.KOI_IN_COLLECTION);
    });

    test("Progress marked with d with extra white space.", () => {
        expect(collectors.get("Akachan").kois.get("Kudai").progress)
            .toBe(Progress.DRAGON_IN_COLLECTION);
    });

    test("Progress marked with white space.", () => {
        expect(collectors.get("Aishite").kois.get("Shigin").progress)
            .toBe(Progress.NOT_YET_COLLECTED);
    });
});

describe("Get collectors A-M when color names are missing dashes.", () => {

    let collectors;
    beforeAll(async() => collectors = 
        await KoiSpreadsheet.getCollectorsAM(spreadsheets.colorsMissingDashes)
    );

    test("Base color does not have a dash.", async() => {
        expectPatternHasKois(collectors, "Buta", ["Kushiro", "Kudai", "Kukatsu", "Kuouka"]);
    });

    test("Common highlight color does not have a dash.", async() => {
        expectPatternHasKois(collectors, "Buta", ["Shidai", "Oredai", "Madai", "Kudai"]);
    });

    test("Rare highlight color does not have a dash.", async() => {
        expectPatternHasKois(collectors, "Buta", ["Shimura", "Oremura", "Mamura", "Kumura"]);
    });

});

test("Get collectors A-M when koi progress is unknown.", async() => {
    await expectUnknownKoiProgress(
        KoiSpreadsheet.getCollectorsAM(spreadsheets.invalidKoiProgress),
        spreadsheets.invalidKoiProgress, 
        "Collector", 
        "Maburu", 
        "Dorama", 
        "kk"
    );
});

test("Get collectors A-M when a pattern name is missing.", async() => {
    await expectKoiSpreadsheetMissingPattern(
        KoiSpreadsheet.getCollectorsAM(spreadsheets.missingPatternNames), 
        spreadsheets.missingPatternNames,
        "A-M: Collectors", 
        198, 
        "B"
    );
});

test("Get collectors A-M when pattern missing a base color.", async() => {
    await expectKoiSpreadsheetMissingColor(
        KoiSpreadsheet.getCollectorsAM(spreadsheets.missingBaseColors), 
        spreadsheets.missingBaseColors,
        "Collector", 
        "Bunki", 
        104, 
        "B"
    );
});

test("Get collectors A-M when pattern missing a highlight color.", async() => {
    await expectKoiSpreadsheetMissingColor(
        KoiSpreadsheet.getCollectorsAM(spreadsheets.missingHighlightColors), 
        spreadsheets.missingHighlightColors,
        "Collector", 
        "Aishite", 
        3, 
        "H"
    );
});

// ============================
// =====GET COLLECTORS N-Z=====
// ============================

testCommonCases("getCollectorsNZ");

describe("Validate collectors N-Z.", () => {

    let collectors;
    beforeAll(async() => 
        collectors = await KoiSpreadsheet.getCollectorsNZ(spreadsheets.valid2)
    );

    test("There are at least 92 collectors N-Z.", () => {
        expect(collectors.size).toBeGreaterThanOrEqual(92);
    });

    test("Validate collector Saru.", () => {
        const COLLECTOR = collectors.get("Saru");
        expect(COLLECTOR).toBeDefined();
        expect(COLLECTOR.type).toBe("Collector");
        expectKoi(COLLECTOR, "Kishiro", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(COLLECTOR, "Kikuro", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(COLLECTOR, "Kiukon", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(COLLECTOR, "Kikosho", "Common", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Akashiro", "Common", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Akakuro", "Common", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Akaukon", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(COLLECTOR, "Akakosho", "Common", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Choshiro", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(COLLECTOR, "Chokuro", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(COLLECTOR, "Choukon", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(COLLECTOR, "Chokosho", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(COLLECTOR, "Ryoshiro", "Common", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Ryokuro", "Common", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Ryoukon", "Common", Progress.KOI_IN_COLLECTION);
        expectKoi(COLLECTOR, "Ryokosho", "Common", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Kisairo", "Rare", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Kikoji", "Rare", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Kimosu", "Rare", Progress.DRAGON_IN_COLLECTION);
        expectKoi(COLLECTOR, "Kikatsu", "Rare", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Akasairo", "Rare", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Akakoji", "Rare", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Akamosu", "Rare", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Akakatsu", "Rare", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Chosairo", "Rare", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Chokoji", "Rare", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Chomosu", "Rare", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Chokatsu", "Rare", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Ryosairo", "Rare", Progress.NOT_YET_COLLECTED);
        expectKoi(COLLECTOR, "Ryokoji", "Rare", Progress.KOI_IN_COLLECTION);
        expectKoi(COLLECTOR, "Ryomosu", "Rare", Progress.KOI_IN_COLLECTION);
        expectKoi(COLLECTOR, "Ryokatsu", "Rare", Progress.NOT_YET_COLLECTED);
    });
});

describe("Get collectors N-Z when koi progresses are bad form but valid.", () => {

    let collectors;
    beforeAll(async() => collectors = 
        await KoiSpreadsheet.getCollectorsNZ(spreadsheets.badButValidKoiProgress)
    );

    test("Progress marked with capital K.", () => {
        expect(collectors.get("Okan").kois.get("Chashiro").progress)
            .toBe(Progress.KOI_IN_COLLECTION);
    });

    test("Progress marked with capital D.", () => {
        expect(collectors.get("Okan").kois.get("Chakuro").progress)
            .toBe(Progress.DRAGON_IN_COLLECTION);
    });

    test("Progress marked with k with extra white space.", () => {
        expect(collectors.get("Oushi").kois.get("Gudai").progress)
            .toBe(Progress.KOI_IN_COLLECTION);
    });

    test("Progress marked with d with extra white space.", () => {
        expect(collectors.get("Oushi").kois.get("Madai").progress)
            .toBe(Progress.DRAGON_IN_COLLECTION);
    });

    test("Progress marked with white space.", () => {
        expect(collectors.get("Oushi").kois.get("Kodai").progress)
            .toBe(Progress.NOT_YET_COLLECTED);
    });
});

describe("Get collectors N-Z when color names are missing dashes.", () => {

    let collectors;
    beforeAll(async() => collectors = 
        await KoiSpreadsheet.getCollectorsNZ(spreadsheets.colorsMissingDashes)
    );

    test("Base color does not have a dash.", async() => {
        expectPatternHasKois(collectors, "Natsu", ["Madai", "Mashiro", "Makatsu", "Magin"]);
    });

    test("Common highlight color does not have a dash.", async() => {
        expectPatternHasKois(collectors, "Nezumi", ["Neshiro", "Gushiro", "Mashiro", "Akashiro"]);
    });

    test("Rare highlight color does not have a dash.", async() => {
        expectPatternHasKois(collectors, "Nitto", ["Oremosu", "Seimosu", "Akamosu", "Kimosu"]);
    });

});

test("Get collectors N-Z when koi progress is unknown.", async() => {
    await expectUnknownKoiProgress(
        KoiSpreadsheet.getCollectorsNZ(spreadsheets.invalidKoiProgress),
        spreadsheets.invalidKoiProgress, 
        "Collector", 
        "Mausu", 
        "Naisu", 
        "dk"
    );
});

test("Get collectors N-Z when a pattern name is missing.", async() => {
    await expectKoiSpreadsheetMissingPattern(
        KoiSpreadsheet.getCollectorsNZ(spreadsheets.missingPatternNames),
        spreadsheets.missingPatternNames, 
        "N-Z: Collectors", 
        639, 
        "B"
    );
});

test("Get collectors N-Z when pattern missing a base color.", async() => {
    await expectKoiSpreadsheetMissingColor(
        KoiSpreadsheet.getCollectorsNZ(spreadsheets.missingBaseColors),
        spreadsheets.missingBaseColors, 
        "Collector", 
        "Onmyo", 
        83, 
        "B"
    );
});

test("Get collectors N-Z when pattern missing a highlight color.", async() => {
    await expectKoiSpreadsheetMissingColor(
        KoiSpreadsheet.getCollectorsNZ(spreadsheets.missingHighlightColors), 
        spreadsheets.missingHighlightColors,
        "Collector", 
        "Roru", 
        178, 
        "D"
    );
});

function testCommonCases(methodToTest)
{
    let getPatterns = KoiSpreadsheet[methodToTest];
    const SHEET = methodToTest.substring(3);
    const TYPE = methodToTest == "getProgressives" ? "Progressive" : "Collector";

    describe(`Successfully get ${SHEET}.`, () => {

        let patterns;
        beforeAll(async() => 
            patterns = await getPatterns(spreadsheets.valid2)
        );

        test(`Each ${TYPE} is of type ${TYPE}.`, () => {
            for (const PATTERN of patterns.values())
            {
                expect(PATTERN.type).toBe(TYPE);
            }
        });

        test("Each pattern has 32 koi.", () => {
            for (const PATTERN of patterns.values())
            {
                expect(PATTERN.kois.size).toBe(32);
            }
        });

        test("Each pattern has 16 common koi.", () => {
            for (const PATTERN of patterns.values())
            {
                let count = 0;
                for (const KOI of PATTERN.kois.values())
                {
                    if (KOI.rarity == "Common")
                    {
                        count++;
                    }
                }
                expect(count).toBe(16);
            }
        });

        test("Each pattern has 16 rare koi.", () => {
            for (const PATTERN of patterns.values())
            {
                let count = 0;
                for (const KOI of PATTERN.kois.values())
                {
                    if (KOI.rarity == "Rare")
                    {
                        count++;
                    }
                }
                expect(count).toBe(16);
            }
        });
    });

    testWithModifiedEnv(`Get ${SHEET}`, async() => getPatterns(spreadsheets.valid));

    test(`Get ${SHEET} of private spreadsheet.`, async() => {
        await expectPrivateSpreadsheet(getPatterns(spreadsheets.private));
    });

    test(`Get ${SHEET} of deleted spreadsheet.`, async() => {
        await expectSpreadsheetNotFound(getPatterns("invalid"), "invalid");
    });

    test(`Get ${SHEET} when spreadsheet has renamed sheets.`, async() => {
        const RANGE =
            methodToTest == "getProgressives" ? "Progressives!I2:AN70" : 
            methodToTest === "getCollectorsAM" ? "A-M: Collectors!B2:K" : 
                                                 "N-Z: Collectors!B2:K";
                                                 
        await expectRangeNotFound(
            getPatterns(spreadsheets.renamedSheets),
            spreadsheets.renamedSheets,
            RANGE
        );
    });
}

function expectKoi(pattern, koiName, rarity, progress)
{
    const KOI = pattern.kois.get(koiName);
    expect(KOI).toBeDefined();
    expect(KOI.rarity).toBe(rarity);
    expect(KOI.progress).toBe(progress);
}    

function expectPatternHasKois(patterns, patternName, kois)
{
    const PATTERN = patterns.get(patternName);
    expect(PATTERN).toBeDefined();
    expect(PATTERN.kois.size).toBe(32);
    for (const KOI of kois)
    {
        expect(PATTERN.kois.get(KOI)).toBeDefined();
    }
}