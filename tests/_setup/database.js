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

async function select(tableName, whereClause, isPlain)
{
    let sequelize = initSequelize();
    let query = `SELECT * FROM ${tableName}`;
    if (whereClause)
    {
        query += " WHERE " + whereClause;
    }

    const RECORD = await sequelize.query(
        query,
        { type: QueryTypes.SELECT, raw: true, plain: isPlain }
    );
    await sequelize.close();
    return RECORD;
}

module.exports = {

    initSequelize: initSequelize,

    dropAllTables: async function()
    {
        let sequelize = initSequelize();
        await sequelize.getQueryInterface().dropAllTables();
        await sequelize.close();
    },

    countRecords: async function(tableName, whereClause)
    {
        let sequelize = initSequelize();
        let query = `SELECT COUNT(*) FROM ${tableName}`;
        if (whereClause)
        {
            query += ` WHERE ${whereClause}`;
        }
        const RECORD = await sequelize.query(
            query,
            { type: QueryTypes.SELECT, raw: true, plain: true }
        );
        await sequelize.close();
        return parseInt(RECORD.count);
    },

    select: async function(tableName, whereClause)
    {
        return select(tableName, whereClause, false);
    },

    selectOne: async function(tableName, whereClause)
    {
        return select(tableName, whereClause, true);
    },

    insert: async function(tableName, record)
    {
        // add timestamps to each record
        record.created_at = new Date();
        record.updated_at = new Date();

        let sequelize = initSequelize();
        await sequelize.getQueryInterface().bulkInsert(tableName, [record]);
        await sequelize.close();
    }

};