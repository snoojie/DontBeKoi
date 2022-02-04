const { initModel, User } = require("../../../src/database/models/user");
const { initSequelize, dropAllTables } = require("../../_setup/database");
const BaseModelTester = require("./_baseModelTester");

BaseModelTester.runColumnTests(
    initModel,
    "users",
    [ "discord_id", "name", "spreadsheet_id" ],
    "discord_id",
    []
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
        const USER_TO_SAVE = {
            discordId: "somediscord", 
            name: "somename", 
            spreadsheetId: "somespreadsheet"
        };
        let savedUser;
        beforeEach(async() => {    
            await User.create(USER_TO_SAVE);
            savedUser = await User.findOne();
        });
        testPropertyExists("discordId");
        testPropertyExists("name");
        testPropertyExists("spreadsheetId");
        function testPropertyExists(propertyName)
        {
            test(`Property ${propertyName} exists.`, () => {
                expect(savedUser[propertyName]).toBe(USER_TO_SAVE[propertyName]);
            });
        }
    });

    // =============================
    // =====PROPERTY ATTRIBUTES=====
    // =============================

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
    
    
});