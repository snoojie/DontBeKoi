const { initSequelize, dropAllTables, getColumns } = require("../../_setup/database");
const { ValidationError } = require("sequelize");
const { initModel: initKoi, Koi } = require("../../../src/database/models/koi");

module.exports = {
    runCommonTests: async function(data)
    {
        const init = data.init;
        const TABLE_NAME = data.tableName;
        const COLUMN_NAMES = data.columnNames;
        const PRIMARY_KEY = data.primaryKey;
        const NULLABLE_COLUMN_NAMES = data.nullableColumnNames;

        let promise = new Promise((resolve) => {

            let sequelize;

            beforeEach(async() => {
                await dropAllTables();
    
                sequelize = initSequelize();
                await init(sequelize);
                await sequelize.sync();
            });

            afterEach(async() => await sequelize.close());

            afterAll(async() => {
                await dropAllTables();
                resolve();
            });
            
            describe("Database columns.", () => {
                
                let columns;

                beforeEach(async() => {
                    columns = await getColumns(TABLE_NAME);
                });
            
                // =======================
                // =====COLUMN EXISTS=====
                // =======================
            
                for (const COLUMN_NAME of 
                    COLUMN_NAMES.concat(["created_at", "updated_at"])
                )
                {
                    test(`There exists ${COLUMN_NAME} column.`, () => {
                        expect(columns[COLUMN_NAME]).toBeDefined();
                    });
                }
            
                test(`There are exactly ${COLUMN_NAMES.length+2} columns.`, () => {
                    expect(Object.keys(columns).length).toBe(COLUMN_NAMES.length+2);
                });
            
                // ===========================
                // =====COLUMN ATTRIBUTES=====
                // ===========================
            
                test(`Column ${PRIMARY_KEY} is the primary key.`, () => {
                    expect(columns[PRIMARY_KEY].primaryKey).toBeTruthy();
                });
            
                for (const COLUMN_NAME of COLUMN_NAMES)
                {
                    if (NULLABLE_COLUMN_NAMES.indexOf(COLUMN_NAME) >= 0)
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
    },

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
    },

    runPropertyExistsTests: async function(initModels, createData, expectedProperties)
    {
        let promise = new Promise((resolve) => {

            describe("Model properties.", () => {

                let sequelize;
            
                beforeEach(async() => {
                    await dropAllTables();
                    
                    sequelize = initSequelize();
                    await initModels(sequelize);
                    await sequelize.sync();
                });
            
                afterEach(async() => await sequelize.close());
            
                afterAll(async() => {
                    await dropAllTables();
                    resolve();
                });
            
                describe("Property exists.", () => {
                    let savedRecord;
                    beforeEach(async() => {    
                        savedRecord = await createData();
                    });
                    for (const PROPERTY_NAME in expectedProperties)
                    {
                        test(`Property ${PROPERTY_NAME} exists.`, () => {
                            expect(savedRecord[PROPERTY_NAME])
                                .toBe(expectedProperties[PROPERTY_NAME]);
                        });
                    }
                });
            });
        });
        
        return promise;
    },

    runRequiredPropertyTests: async function(initModels, validObject, create, postSync)
    {
        let promise = new Promise((resolve) => {

            describe("Model properties.", () => {

                let sequelize;
            
                beforeEach(async() => {
                    await dropAllTables();
                    
                    sequelize = initSequelize();
                    await initModels(sequelize);
                    await sequelize.sync();

                    if (postSync)
                    {
                        await postSync();
                    }
                });
            
                afterEach(async() => await sequelize.close());
            
                afterAll(async() => {
                    await dropAllTables();
                    resolve();
                });
            
                for (const PROPERTY_NAME in validObject)
                {
                    test(`Property ${PROPERTY_NAME} is required.`, async() => {
                        let objectToCreate = { ... validObject };
                        delete objectToCreate[PROPERTY_NAME];
                        await expect(create(objectToCreate))
                            .rejects.toThrow(ValidationError);
                    });
                }
            });
        });
        
        return promise;
    }

};