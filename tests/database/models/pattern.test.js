const { initPattern, Pattern } = require("../../../src/database/models/pattern");
const { testModel } = require("../../_setup/database");

const PATTERN = { name: "somename", type: "sometype", hatchTime: 99 };

testModel({

    init: async function(sequelize)
    {
        await initPattern(sequelize);
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