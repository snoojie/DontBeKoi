const { initSequelize, dropAllTables, getColumns } = require("../../_setup/database");
const { ValidationError } = require("sequelize");

module.exports = {
    runCommonTests: async function(data)
    {
        const init = data.init;

        // column
        const TABLE_NAME = data.tableName;
        const COLUMN_NAMES = data.columnNames;
        const PRIMARY_KEY = data.primaryKey;
        const NULLABLE_COLUMN_NAMES = data.nullableColumnNames ? data.nullableColumnNames : [];

        // property
        const RECORD_EXAMPLE = data.recordExample;
        const OPTIONAL_PROPERTIES = data.optionalProperties ? data.optionalProperties : [];
        const beforePropertyExistsTests = data.beforePropertyExistsTests;
        const beforeRequiredPropertyTests = data.beforeRequiredPropertyTests
        const create = data.create

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

            describe("Property exists.", () => {
                let savedRecord;
                beforeEach(async() => {    
                    savedRecord = await beforePropertyExistsTests();
                });
                for (const PROPERTY_NAME in RECORD_EXAMPLE)
                {
                    test(`Property ${PROPERTY_NAME} exists.`, () => {
                        expect(savedRecord[PROPERTY_NAME])
                            .toBe(RECORD_EXAMPLE[PROPERTY_NAME]);
                    });
                }
            });

            describe("Required properties.", () => {

                beforeEach(async() => {
                    if (beforeRequiredPropertyTests)
                    {
                        await beforeRequiredPropertyTests();
                    }
                });

                for (const PROPERTY_NAME in RECORD_EXAMPLE)
                {
                    if (OPTIONAL_PROPERTIES.indexOf(PROPERTY_NAME) >= 0)
                    {
                        test(`Property ${PROPERTY_NAME} is optional.`, async() => {
                            let objectToCreate = { ... RECORD_EXAMPLE };
                            delete objectToCreate[PROPERTY_NAME];
                            await expect(create(objectToCreate));
                        });
                    }
                    else
                    {
                        test(`Property ${PROPERTY_NAME} is required.`, async() => {
                            let objectToCreate = { ... RECORD_EXAMPLE };
                            delete objectToCreate[PROPERTY_NAME];
                            await expect(create(objectToCreate))
                                .rejects.toThrow(ValidationError);
                        });
                    }
                }
            });
        });

        return promise;
    }
};