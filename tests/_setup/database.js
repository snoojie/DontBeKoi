const { Sequelize } = require("sequelize");
require("dotenv").config();

function initSequelize()
{
    return new Sequelize(
        process.env.TEST_DATABASE_URL, 
        { 
            logging: false,
            quoteIdentifiers: false,
            define: { underscored: true } 
        }
    );
}

module.exports = {

    initSequelize: initSequelize,

    dropAllTables: async function()
    {
        let sequelize = initSequelize();
        await sequelize.getQueryInterface().dropAllTables();
        await sequelize.close();
    }
};