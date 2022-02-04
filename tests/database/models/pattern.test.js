const { initModel, Pattern } = require("../../../src/database/models/pattern");
const { initSequelize, dropAllTables, getColumns } = require("../../_setup/database");
const BaseModelTester = require("./_baseModelTester");

BaseModelTester.runColumnTests(
    initModel,
    "patterns",
    [ "name", "type", "hatch_time" ],
    "name",
    [ "hatch_time" ]
);

describe("Model property tests.", () => {
    let sequelize;

    beforeEach(async() => {
        await dropAllTables();
        
        // function to test
        sequelize = initSequelize();
        await initModel(sequelize);
        await sequelize.sync();
    });

    afterEach(async() => await sequelize.close());

    afterAll(async() => await dropAllTables());

    // =========================
    // =====PROPERTY EXISTS=====
    // =========================

    describe("Property exists.", () => {
        const PATTERN_TO_SAVE = {
            name: "somename", 
            type: "sometype",
            hatchTime: 99
        };
        let savedPattern;
        beforeEach(async() => {
            await Pattern.create(PATTERN_TO_SAVE);
            savedPattern = await Pattern.findOne();
        });
        testPropertyExists("discordId");
        testPropertyExists("name");
        testPropertyExists("spreadsheetId");
        function testPropertyExists(propertyName)
        {
            test(`Property ${propertyName} exists.`, () => {
                expect(savedPattern[propertyName]).toBe(PATTERN_TO_SAVE[propertyName]);
            });
        }
    });

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
    });
});