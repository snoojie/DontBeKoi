const BaseModelTester = require("./_baseModelTester");
const { initModel: initKoi, Koi } = require("../../../src/database/models/koi");
const { initModel: initPattern, Pattern } = 
    require("../../../src/database/models/pattern");
const { initSequelize, dropAllTables, getColumns } = require("../../_setup/database");
const { ForeignKeyConstraintError } = require("sequelize");
const { default: ErrorMessages } = require("../../../src/errorMessages");

const PATTERN = { name: "somepattern", type: "sometype" };
const KOI = { name: "somekoi", rarity: "somerarity", patternName: PATTERN.name };

async function init(sequelize)
{
    await initPattern(sequelize);
    await initKoi(sequelize);
}

BaseModelTester.runCommonTests({

    init: init,

    tableName: "kois",
    columnNames: ["id", "name", "rarity", "pattern_name"],
    primaryKey: "id",

    recordExample: KOI,
    beforePropertyExistsTests: async function() {
        await Pattern.create(PATTERN);
        await Koi.create(KOI);
        const SAVED_KOI = await Koi.findOne();
        return SAVED_KOI;
    },
    beforeRequiredPropertyTests: async function() {
        await Pattern.create(PATTERN);
    },
    create: async function(koi)
    {
        const KOI = await Koi.create(koi);
        return KOI;
    }
});

// =============================
// =====ASSOCIATION TESTING=====
// =============================

describe("Association testing.", () => {
    let sequeilize;
    beforeEach(async() => {
        await dropAllTables();
        sequelize = initSequelize();
    });

    afterEach(async() => await sequelize.close());

    afterAll(async() => {
        await dropAllTables();
    });

    test("Error initializing kois before patterns.", () => {
        expect(() => initKoi(sequelize))
            .toThrow(ErrorMessages.DATABASE.CANNOT_INITIALIZE_KOI);
    });

    describe("Init models before tests.", () => {
        beforeEach(async() => {
            await init(sequelize);
            await sequelize.sync();
        });

        test("Error creating koi whose pattern does not exist.", async () => {
            await expect(Koi.create(
                { name: "someKoi", rarity: "somerarity", patternName: "invalidpattern" }
            )).rejects.toThrow(ForeignKeyConstraintError);
        });

        test("Error updating koi to a pattern that does not exist.", async () => {
            await Pattern.create({ name: "validpattern", type: "sometype "});
            let koi = await Koi.create({ name: "someKoi", rarity: "somerarity", patternName: "validpattern" });
            koi.patternName = "invalidpattern";
            await expect(koi.save()).rejects.toThrow(ForeignKeyConstraintError);
        });

        describe("Prepopulate tables.", () => {

            beforeEach(async() => {
                await Pattern.create(PATTERN);
                await Koi.create(KOI);
            });

            test("Can get pattern details from koi model.", async() => {                
                const KOI_RECORD = 
                    await Koi.findOne({ include: Koi.associations.pattern });
                expect(KOI_RECORD.name).toBe(KOI.name);
                expect(KOI_RECORD.patternName).toBe(KOI.patternName);
                expect(KOI_RECORD.pattern).toBeDefined();
                expect(KOI_RECORD.pattern.name).toBe(PATTERN.name);
                expect(KOI_RECORD.pattern.type).toBe(PATTERN.type);
            });
    
            test("Can get koi details from pattern model.", async() => {
                const PATTERN_RECORD = 
                    await Pattern.findOne({ include: Pattern.associations.kois });
                expect(PATTERN_RECORD.name).toBe(PATTERN.name);
                expect(PATTERN_RECORD.kois).toBeDefined();
                expect(PATTERN_RECORD.kois.length).toBe(1);
                expect(PATTERN_RECORD.kois[0].name).toBe(KOI.name);
                expect(PATTERN_RECORD.kois[0].patternName).toBe(PATTERN.name);
            });
        });
        
    });    
})