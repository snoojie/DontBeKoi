const { initUser, User } = require("../../../src/database/models/user");
const { testModel } = require("../../_setup/database");

const USER = { discordId: "did", name: "somename", "spreadsheetId": "sid" };

testModel({

    init: function(sequelize)
    {
        initUser(sequelize);
    },

    tableName: "users",
    columnNames: [ "discord_id", "name", "spreadsheet_id" ],
    primaryKey: "discord_id",

    recordExample: USER,
    beforePropertyExistsTests: async function() {
        await User.create(USER);
        const SAVED_USER = await User.findOne();
        return SAVED_USER;
    },
    create: async function(user)
    {
        await User.create(user);
    }
});