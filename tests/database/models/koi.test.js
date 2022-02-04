const BaseModelTester = require("./_baseModelTester");
const { initModel } = require("../../../src/database/models/koi");

BaseModelTester.runColumnTests(
    initModel,
    "kois",
    ["id", "name", "rarity", "pattern_name"],
    "id",
    []
);

// =========================
// =====PROPERTY EXISTS=====
// =========================
/*
describe("Model properties.", () => {
    const KOI_TO_SAVE = {
        name: "somename", 
        rarity: "somerarity",
        patternName: "somepattern"
    };
    let savedKoi;
    beforeEach(async() => {
        await Koi.create(KOI_TO_SAVE);
        savedKoi = await Koi.findOne();
    });
    
    testPropertyExists("name");
    testPropertyExists("patternName");
    testPropertyExists("hatchTime");
    function testPropertyExists(propertyName)
    {
        test(`Property ${propertyName} exists.`, () => {
            expect(savedKoi[propertyName]).toBe(KOI_TO_SAVE[propertyName]);
        });
    }
});

/*
// =============================
// =====PROPERTY ATTRIBUTES=====
// =============================

test("Property name is required.", async() => {
    await expect(
        Pattern.create({type: "some type", hatch_time: 99 })
    ).rejects.toThrow();
});

test("Property type is required.", async() => {
    await expect(
        Pattern.create({name: "some name", hatch_time: 99 })
    ).rejects.toThrow();
});

test("Property hatch_time is optional.", async() => {
    await Pattern.create({ name: "withNullTime", type: "some type" });
    const SAVED_PATTERN = 
        await Pattern.findOne({where: {name: "withNullTime"}});
    expect(SAVED_PATTERN).toBeDefined();
    expect(SAVED_PATTERN.name).toBe("withNullTime");
    expect(SAVED_PATTERN.type).toBe("some type");
    expect(SAVED_PATTERN.hatch_time).toBeUndefined();
});*/