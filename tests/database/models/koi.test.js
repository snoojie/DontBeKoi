const BaseModelTester = require("./_baseModelTester");
const { initModel: initKoi, Koi } = require("../../../src/database/models/koi");
const { initModel: initPattern, Pattern } = require("../../../src/database/models/pattern");
const { initSequelize, dropAllTables } = require("../../_setup/database");

async function initModels(sequelize)
{
    await initPattern(sequelize);
    await initKoi(sequelize);
}

BaseModelTester.runColumnTests(
    initModels,
    "kois",
    ["id", "name", "rarity", "pattern_name"],
    "id",
    []
);

describe("Model properties.", () => {
    let sequelize;
    const PATTERN = { name: "somepattern", type: "sometype" };

    beforeEach(async() => {
        await dropAllTables();
        
        sequelize = initSequelize();
        await initModels(sequelize);
        await sequelize.sync();

        await Pattern.create(PATTERN);
    });

    afterEach(async() => await sequelize.close());

    afterAll(async() => await dropAllTables());

    // =========================
    // =====PROPERTY EXISTS=====
    // =========================

    describe("Property exists.", () => {
        const KOI_TO_SAVE = {
            name: "somekoi", 
            rarity: "somerarity",
            patternName: PATTERN.name
        };
        let savedKoi;
        beforeEach(async() => {    
            await Koi.create(KOI_TO_SAVE);
            savedKoi = await Koi.findOne();
        });
        testPropertyExists("name");
        testPropertyExists("rarity");
        testPropertyExists("patternName");
        function testPropertyExists(propertyName)
        {
            test(`Property ${propertyName} exists.`, () => {
                expect(savedKoi[propertyName]).toBe(KOI_TO_SAVE[propertyName]);
            });
        }
    });

    // =============================
    // =====PROPERTY ATTRIBUTES=====
    // =============================

    test("Property name is required.", async() => {
        await expect(
            Koi.create({ patternName: PATTERN.name, rarity: "somerarity" })
        ).rejects.toThrow();
    });

    test("Property rarity is required.", async() => {
        await expect(
            Koi.create({ name: "somekoi", patternName: PATTERN.name })
        ).rejects.toThrow();
    });

    test("Property patternName is required.", async() => {
        await expect(
            Koi.create({ name: "somekoi", rarity: "somerarity" })
        ).rejects.toThrow();
    });
});