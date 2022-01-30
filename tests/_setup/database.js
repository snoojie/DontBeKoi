const { Sequelize } = require("sequelize");
require('dotenv').config()

console.log(process.env);
const DATABASE_URL = process.env.TEST_DATABASE_URL;

function initSequelize()
{
    console.log(DATABASE_URL);
    return new Sequelize(
        DATABASE_URL, 
        { 
            logging: false,
            quoteIdentifiers: false,
            define: { underscored: true } 
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