const { CommunitySpreadsheet } =require("../../src/google/communitySpreadsheet");

// ==================
// =====OVERVIEW=====
// ==================

test("Overview includes collectors.", async () => {
    let overview = await CommunitySpreadsheet.getOverview();
    expectOverviewHasType("Collector");
});

test("Overview includes progressives.", async () => {
    let overview = await CommunitySpreadsheet.getOverview();
    expectOverviewHasType(overview, "Progressive");
});

function expectOverviewHasType(overview, type)
{
    let hasType = false;
    for (let entry of overview)
    {
        if (entry.type == type)
        {
            hasType = true;
            break;
        }
    }
    expect(hasType).toBeTruthy();
}

test("There are 30 progressives.", async () => {
    let overview = await CommunitySpreadsheet.getOverview();
    let count = getOverviewCountOfType(overview, "Progressive");
    expect(count).toBe(30);
});

test("There are at least 208 collectors.", async () => {
    let overview = await CommunitySpreadsheet.getOverview();
    let count = getOverviewCountOfType(overview, "Collector");
    expect(count).toBeLessThanOrEqual(208);
});

function getOverviewCountOfType(overview, type)
{
    let count = 0;
    for (let entry of overview)
    {
        if (entry.type == type)
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
        let overview = await CommunitySpreadsheet.getOverview();
        let found = false;
        for (let entry of overview)
        {
            if (entry.name == name && 
                entry.type == type && 
                entry.hatchTime == hatchTime
            ) 
            {
                found = true;
                break;
            }
        }
        expect(found).toBeTruthy();
    });
}