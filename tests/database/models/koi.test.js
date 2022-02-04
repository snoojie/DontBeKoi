const BaseModelTester = require("./_baseModelTester");
const { initModel: initKoi, Koi } = require("../../../src/database/models/koi");
const { initModel: initPattern, Pattern } = require("../../../src/database/models/pattern");
const { initSequelize, dropAllTables } = require("../../_setup/database");
const { ValidationError, ForeignKeyConstraintError } = require("sequelize");

async function initModels(sequelize)
{
    await initPattern(sequelize);
    await initKoi(sequelize);
}

BaseModelTester.runCommonTests({

    init: async function(sequelize)
    {
        await initPattern(sequelize);
        await initKoi(sequelize);
    },

    tableName: "kois",
    columnNames: ["id", "name", "rarity", "pattern_name"],
    primaryKey: "id",
    nullableColumnNames: []
});
/*
BaseModelTester.runColumnTests(
    initModels,
    "kois",
    ["id", "name", "rarity", "pattern_name"],
    "id",
    []
);


const PATTERN = { name: "somepattern", type: "sometype" };
const KOI_TO_SAVE = { name: "somekoi", rarity: "somerarity", patternName: PATTERN.name };
BaseModelTester.runPropertyExistsTests(
    initModels,
    async function() {
        await Pattern.create(PATTERN);
        await Koi.create(KOI_TO_SAVE);
        const SAVED_KOI = await Koi.findOne();
        return SAVED_KOI;
    },
    KOI_TO_SAVE
);

BaseModelTester.runRequiredPropertyTests(
    initModels,
    KOI_TO_SAVE,
    async function(koi)
    {
        await Koi.create(koi);
    },
    async function() {
        await Pattern.create(PATTERN);
    },
);*/