const BaseModelTester = require("./_baseModelTester");
const { initModel, Pattern } = require("../../../src/database/models/pattern");

const PATTERN = { name: "somename", type: "sometype", hatchTime: 99 };

BaseModelTester.runCommonTests({

    init: async function(sequelize)
    {
        await initModel(sequelize);
    },

    tableName: "patterns",
    columnNames:[ "name", "type", "hatch_time" ],
    primaryKey: "name",
    nullableColumnNames: ["hatch_time"],

    recordExample: PATTERN,
    optionalProperties: [ "hatchTime" ],
    beforePropertyExistsTests: async function() {
        await Pattern.create(PATTERN);
        const SAVED_PATTERN = await Pattern.findOne();
        return SAVED_PATTERN;
    },
    create: async function(pattern)
    {
        await Pattern.create(pattern);
    }
});