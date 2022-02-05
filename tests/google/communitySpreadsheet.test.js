const { CommunitySpreadsheet } = require("../../src/google/communitySpreadsheet");

// get overview and kois once for the tests
// this is to lower the read count because of google's quota
let overview;
let kois;
beforeAll(async () => {
    overview = await CommunitySpreadsheet.getOverview();
    kois = await CommunitySpreadsheet.getKois();
});

// ==================
// =====OVERVIEW=====
// ==================

testOverviewHasType("Collector");
testOverviewHasType("Progressive");
function testOverviewHasType(type)
{
    test(`Overview includes ${type.toLowerCase()}s.`, () => {
        let hasType = false;
        for (const ENTRY of overview)
        {
            if (ENTRY.type == type)
            {
                hasType = true;
                break;
            }
        }
        expect(hasType).toBeTruthy();
    })
}

test("Overview has no types other than progressive and collector.", () => {
    let hasWrongType = false;
    for (const ENTRY of overview)
    {
        if (ENTRY.type != "Progressive" && ENTRY.type != "Collector")
        {
            hasWrongType = true;
            break;
        }
    }
    expect(hasWrongType).toBeFalsy();
})

test("There are 30 progressives.", () => {
    const COUNT = getOverviewCountOfType("Progressive");
    expect(COUNT).toBe(30);
});

test("There are at least 208 collectors.", () => {
    let COUNT = getOverviewCountOfType("Collector");
    expect(COUNT).toBeLessThanOrEqual(208);
});

function getOverviewCountOfType(type)
{
    let count = 0;
    for (const ENTRY of overview)
    {
        if (ENTRY.type == type)
        {
            count++;
        }
    }
    return count;
}

testOverviewHasPattern("Daimon", "Collector", 5);
testOverviewHasPattern("Totemu", "Collector", 9);
testOverviewHasPattern("Shapu", "Progressive", undefined);
function testOverviewHasPattern(name, type, hatchTime)
{
    test(
        `${name} is a ${type.toLowerCase()} with a hatch time of ${hatchTime} hours.`, 
        () => 
    {
        let found = false;
        for (const ENTRY of overview)
        {
            if (ENTRY.name == name && 
                ENTRY.type == type && 
                ENTRY.hatchTime == hatchTime
            ) 
            {
                found = true;
                break;
            }
        }
        expect(found).toBeTruthy();
    });
}

// ==============
// =====KOIS=====
// ==============

testKoisIncludeRarity("Common");
testKoisIncludeRarity("Rare");
function testKoisIncludeRarity(rarity)
{
    test(`There are ${rarity.toLowerCase()} koi.`, () => {
        let hasRarity = false;
        for (const KOI of kois)
        {
            if (KOI.rarity == rarity)
            {
                hasRarity = true;
                break;
            }
        }
        expect(hasRarity).toBeTruthy();
    });
}

test("Kois are only common or rare.", () => {
    let hasWrongRarity = false;
    for (const KOI of kois)
    {
        if (KOI.rarity != "Common" && KOI.rarity != "Rare")
        {
            hasWrongRarity = true;
            break;
        }
    }
    expect(hasWrongRarity).toBeFalsy();
});

test("There are at least 7,616 koi.", () => {
    expect(kois.length).toBeGreaterThanOrEqual(7616);
});

test("There are the same number of common as rare koi.", () => {
    let commonCount = 0;
    let rareCount = 0;
    for (const KOI of kois)
    {
        if (KOI.rarity == "Common")
        {
            commonCount++;
        }
        else if (KOI.rarity == "Rare")
        {
            rareCount++;
        }
    }
    expect(commonCount).toBe(rareCount);
});

test("Getting koi ignores accented characters", () => {
    // normally color chakoji for pattern mukei is accented
    const KOI = kois.find(koi => koi.pattern == "Mukei" && koi.name == "Chakoji");
    expect(KOI).toBeDefined();
});

// ===========================
// =====OVERVIEW AND KOIS=====
// ===========================

test("There are 32 times more koi than patterns.", () => {
    expect(32 * overview.length).toBe(kois.length);
});

test("Each koi has a pattern defined in the overview.", () => {
    let koiHasPatternNotInOverview = false;
    for (const KOI of kois)
    {
        if (!overview.find(entry => KOI.pattern == entry.name))
        {
            koiHasPatternNotInOverview = true;
            break;
        }
    }
    expect(koiHasPatternNotInOverview).toBeFalsy();
});

test("Each pattern in the overview has koi.", () => {
    let overviewHasPatternWithoutKoi = false;
    for (const OVERVIEW_ENTRY of overview)
    {
        if (!kois.find(koi => koi.pattern == OVERVIEW_ENTRY.name))
        {
            overviewHasPatternWithoutKoi = true;
            break;
        }
    }
    expect(overviewHasPatternWithoutKoi).toBeFalsy();
});