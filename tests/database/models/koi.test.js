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

    beforeEach(async() => {
        await dropAllTables();
        
        sequelize = initSequelize();
        await initModels(sequelize);
        await sequelize.sync();
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
            patternName: "somepattern"
        };
        let savedKoi;
        beforeEach(async() => {    
            await Pattern.create({name: "somepattern", type: "sometype"})
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
/*
    test("Property discordId is required.", async() => {
        await expect(
            User.create({name: "some name", spreadsheetId: "some spreadsheet" })
        ).rejects.toThrow();
    });

    test("Property name is required.", async() => {
        await expect(
            User.create({discordId: "some discord id", spreadsheetId: "some spreadsheet" })
        ).rejects.toThrow();
    });

    test("Property spreadsheetId is required.", async() => {
        await expect(
            User.create({discordId: "some discordid", name: "some name" })
        ).rejects.toThrow();
    });
    
    */
});