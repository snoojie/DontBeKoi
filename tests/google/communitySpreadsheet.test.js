const { CommunitySpreadsheet } =require("../../src/google/communitySpreadsheet");

test("Overview includes collectors.", async () => {
    let overview = await CommunitySpreadsheet.getOverview();
    let hasCollectors = false;
    for (let entry of overview)
    {
        if (entry.type == "Collector")
        {
            hasCollectors = true;
            break;
        }
    }
    expect(hasCollectors).toBeTruthy();
});

test("Overview includes progressives.", async () => {
    let overview = await CommunitySpreadsheet.getOverview();
    let hasProgressives = false;
    for (let entry of overview)
    {
        if (entry.type == "Progressive")
        {
            hasProgressives = true;
            break;
        }
    }
    expect(hasProgressives).toBeTruthy();
});

test("There are 30 progressives.", async () => {
    let overview = await CommunitySpreadsheet.getOverview();
    let count = 0;
    for (let entry of overview)
    {
        if (entry.type == "Progressive")
        {
            count++;
        }
    }
    expect(count).toBe(30);
});

test("There are at least 208 collectors.", async () => {
    let overview = await CommunitySpreadsheet.getOverview();
    let count = 0;
    for (let entry of overview)
    {
        if (entry.type == "Collector")
        {
            count++;
        }
    }
    expect(count).toBeLessThanOrEqual(208);
});

testSpecificPattern("Daimon", "Collector", 5);
testSpecificPattern("Totemu", "Collector", 9);
testSpecificPattern("Shapu", "Progressive", undefined);
function testSpecificPattern(name, type, hatchTime)
{
    test(`${name} is a ${type.toLowerCase()} with a hatch time of ${hatchTime} hours.`, async () => {
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