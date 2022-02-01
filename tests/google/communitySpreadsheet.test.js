const { CommunitySpreadsheet } = require("../../src/google/communitySpreadsheet");

// ==================
// =====OVERVIEW=====
// ==================

testOverviewHasType("Collector");
testOverviewHasType("Progressive");
function testOverviewHasType(type)
{
    test(`Overview includes ${type.toLowerCase()}s.`, async() => {
        const OVERVIEW = await CommunitySpreadsheet.getOverview();
        let hasType = false;
        for (const ENTRY of OVERVIEW)
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

test("Overview has no types other than progressive and collector.", async() => {
    const OVERVIEW = await CommunitySpreadsheet.getOverview();
    let hasWrongType = false;
    for (const ENTRY of OVERVIEW)
    {
        if (ENTRY.type != "Progressive" && ENTRY.type != "Collector")
        {
            hasWrongType = true;
            break;
        }
    }
    expect(hasWrongType).not.toBeTruthy();
})

test("There are 30 progressives.", async () => {
    const OVERVIEW = await CommunitySpreadsheet.getOverview();
    const COUNT = getOverviewCountOfType(OVERVIEW, "Progressive");
    expect(COUNT).toBe(30);
});

test("There are at least 208 collectors.", async () => {
    let OVERVIEW = await CommunitySpreadsheet.getOverview();
    let COUNT = getOverviewCountOfType(OVERVIEW, "Collector");
    expect(COUNT).toBeLessThanOrEqual(208);
});

function getOverviewCountOfType(overview, type)
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
        async () => 
    {
        const OVERVIEW = await CommunitySpreadsheet.getOverview();
        let found = false;
        for (const ENTRY of OVERVIEW)
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
    test(`There are ${rarity.toLowerCase()} koi.`, async() => {
        const KOIS = await CommunitySpreadsheet.getKois();
        let hasRarity = false;
        for (const KOI of KOIS)
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

test("Kois are only common or rare.", async() => {
    const KOIS = await CommunitySpreadsheet.getKois();
    let hasWrongRarity = false;
    for (const KOI of KOIS)
    {
        if (KOI.rarity != "Common" && KOI.rarity != "Rare")
        {
            hasWrongRarity = true;
            break;
        }
    }
    expect(hasWrongRarity).not.toBeTruthy();
});

test("There are at least 7,616 koi.", async () => {
    const KOIS = await CommunitySpreadsheet.getKois();
    expect(KOIS.length).toBeGreaterThanOrEqual(7616);
});

test("There are the same number of common as rare koi.", async () => {
    const KOIS = await CommunitySpreadsheet.getKois();
    let commonCount = 0;
    let rareCount = 0;
    for (const KOI of KOIS)
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

test("Getting koi ignores accented characters", async() => {
    // normally color chakoji for pattern mudei is accented
    const KOIS = await CommunitySpreadsheet.getKois();
    const KOI = KOIS.find(koi => {
        return koi.pattern = "Mudei" && koi.name == "Chakoji"
    });
    expect(KOI).toBeDefined();
});

// ===========================
// =====OVERVIEW AND KOIS=====
// ===========================

test("There are 32 times more koi than patterns.", async() => {
    const OVERVIEW = await CommunitySpreadsheet.getOverview();
    const KOIS = await CommunitySpreadsheet.getKois();
    expect(32 * OVERVIEW.length).toBe(KOIS.length);
});

test("Each koi has a pattern defined in the overview.", async() => {
    const OVERVIEW = await CommunitySpreadsheet.getOverview();
    const KOIS = await CommunitySpreadsheet.getKois();
    let koiHasPatternNotInOverview = false;
    for (const KOI of KOIS)
    {
        if (!OVERVIEW.find(entry => KOI.pattern == entry.name))
        {
            koiHasPatternNotInOverview = true;
            break;
        }
    }
    expect(koiHasPatternNotInOverview).not.toBeTruthy();
});

test("Each pattern in the overview has koi.", async() => {
    const OVERVIEW = await CommunitySpreadsheet.getOverview();
    const KOIS = await CommunitySpreadsheet.getKois();
    let overviewHasPatternWithoutKoi = false;
    for (const OVERVIEW_ENTRY of OVERVIEW)
    {
        if (!KOIS.find(koi => koi.pattern == OVERVIEW_ENTRY.name))
        {
            overviewHasPatternWithoutKoi = true;
            break;
        }
    }
    expect(overviewHasPatternWithoutKoi).not.toBeTruthy();
});