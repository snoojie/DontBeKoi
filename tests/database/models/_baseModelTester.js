const { initSequelize, dropAllTables, getColumns } = require("../../_setup/database");

module.exports = {

    runColumnTests: 
        async function(initModel, tableName, columnNames, primaryKey, nullableColumnNames)
    {
        let promise = new Promise((resolve, reject) => {
            
            describe("Database columns.", () => {
                let sequelize;
                let columns;

                beforeEach(async() => {
                    await dropAllTables();
        
                    // function to test
                    sequelize = initSequelize();
                    await initModel(sequelize);
                    await sequelize.sync();

                    columns = await getColumns(tableName);
                });

                afterEach(async() => await sequelize.close());

                afterAll(async() => {
                    await dropAllTables();
                    resolve();
                });
            
                // =======================
                // =====COLUMN EXISTS=====
                // =======================
            
                for (const COLUMN_NAME of 
                    columnNames.concat(["created_at", "updated_at"])
                )
                {
                    test(`There exists ${COLUMN_NAME} column.`, () => {
                        expect(columns[COLUMN_NAME]).toBeDefined();
                    });
                }
            
                test(`There are exactly ${columnNames.length+2} columns.`, () => {
                    expect(Object.keys(columns).length).toBe(columnNames.length+2);
                });
            
                // ===========================
                // =====COLUMN ATTRIBUTES=====
                // ===========================
            
                test(`Column ${primaryKey} is the primary key.`, () => {
                    expect(columns[primaryKey].primaryKey).toBeTruthy();
                });
            
                for (const COLUMN_NAME of columnNames)
                {
                    if (nullableColumnNames.indexOf(COLUMN_NAME) >= 0)
                    {
                        test(`Column ${COLUMN_NAME} can be null.`, () => {
                            expect(columns[COLUMN_NAME].allowNull).toBeTruthy();
                        });
                    }
                    else
                    {
                        test(`Column ${COLUMN_NAME} cannot be null.`, () => {
                            expect(columns[COLUMN_NAME].allowNull).toBeFalsy();
                        });
                    }
                }
                
            });
        });

        return promise;
    }
};