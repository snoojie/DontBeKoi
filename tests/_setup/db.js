const { Sequelize } = require("sequelize");

const DATABASE_URL = "postgres://postgres:478963@localhost:5432/dontbekoitest";

function initSequelize()
{
    return new Sequelize(
        DATABASE_URL, 
        { 
            logging: false,
            quoteIdentifiers: false
        }
    );
}

module.exports = {

    DATABASE_URL: DATABASE_URL,

    initSequelize: initSequelize,

    dropAllTables: async function()
    {
        let sequelize = initSequelize();
        await sequelize.getQueryInterface().dropAllTables();
        await sequelize.close();
    }
};