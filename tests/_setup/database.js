const { Sequelize, QueryTypes } = require("sequelize");
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
    },

    countRecords: async function(sequelize, tableName, whereClause)
    {
        let query = `SELECT COUNT(*) FROM ${tableName}`;
        if (whereClause)
        {
            query += ` WHERE ${whereClause}`;
        }
        const RECORD = await sequelize.query(
            query,
            { type: QueryTypes.SELECT, raw: true, plain: true }
        );
        return parseInt(RECORD.count);
    }

};