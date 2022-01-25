const { Sequelize } = require("sequelize");

const DATABASE_URL = "postgres://postgres:478963@localhost:5432/dontbekoitest";

module.exports = {

    DATABASE_URL: DATABASE_URL,

    dropAllTables: async function()
    {
        let sequelize = new Sequelize(DATABASE_URL, { logging: false });
        await sequelize.getQueryInterface().dropAllTables();
        await sequelize.close();
    }
};