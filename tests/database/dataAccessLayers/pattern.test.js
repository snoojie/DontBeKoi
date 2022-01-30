const PatternDal = require("../../../src/database/dataAccessLayers/pattern").default;
const { dropAllTables, initSequelize } = require("../../_setup/database");

let sequelize;

// Start every test with no user table in the database.
// Drop the user table after the last test.
// Start a sequelize connection to be used before each test,
// and close that connection after each test.
beforeEach(async() => {
    await dropAllTables();
    sequelize = initSequelize();
});
afterEach(async() => await sequelize.close());
afterAll(async () => await dropAllTables());

// ===================
// =====test init=====
// ===================

test("Initializing patterns creates Patterns table when it did not exist prior.", async () => {
    await UserDal.init(sequelize);
    await expectUserTableExists();
});
