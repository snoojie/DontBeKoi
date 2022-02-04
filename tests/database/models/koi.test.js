const BaseModelTester = require("./_baseModelTester");
const { initModel: initKoi, Koi } = require("../../../src/database/models/koi");
const { initModel: initPattern, Pattern } = 
    require("../../../src/database/models/pattern");
const { ForeignKeyConstraintError } = require("sequelize");


const PATTERN = { name: "somepattern", type: "sometype" };
const KOI_TO_SAVE = { name: "somekoi", rarity: "somerarity", patternName: PATTERN.name };

BaseModelTester.runCommonTests({

    init: async function(sequelize)
    {
        await initPattern(sequelize);
        await initKoi(sequelize);
    },

    tableName: "kois",
    columnNames: ["id", "name", "rarity", "pattern_name"],
    primaryKey: "id",

    recordExample: KOI_TO_SAVE,
    beforePropertyExistsTests: async function() {
        await Pattern.create(PATTERN);
        await Koi.create(KOI_TO_SAVE);
        const SAVED_KOI = await Koi.findOne();
        return SAVED_KOI;
    },
    beforeRequiredPropertyTests: async function() {
        await Pattern.create(PATTERN);
    },
    create: async function(koi)
    {
        await Koi.create(koi);
    }
});