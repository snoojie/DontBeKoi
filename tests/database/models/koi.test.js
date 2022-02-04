const { initModel, Koi } = require("../../../src/database/models/koi");
const { initSequelize, dropAllTables, getColumns } = require("../../_setup/database");

let sequelize;

beforeEach(async() => {
    await dropAllTables();
    
    // function to test
    sequelize = initSequelize();
    await initModel(sequelize);
    await sequelize.sync();
});

afterEach(async() => sequelize.close());

afterAll(async() => await dropAllTables());

describe("Database columns.", () => {
    let columns;
    beforeEach(async() => 
        columns = await getColumns("kois")
    );

    // =======================
    // =====COLUMN EXISTS=====
    // =======================

    testColumnExists("name");
    testColumnExists("rarity");
    testColumnExists("pattern");
    testColumnExists("id");
    testColumnExists("created_at");
    testColumnExists("updated_at");
    function testColumnExists(columnName)
    {
        test(`There exists ${columnName} column.`, () => {
            expect(columns[columnName]).toBeDefined();
        });
    }

    test("There are exactly 6 columns.", () => {
        expect(Object.keys(columns).length).toBe(6);
    });

    // ===========================
    // =====COLUMN ATTRIBUTES=====
    // ===========================

    test("Column id is the primary key.", () => {
        expect(columns.id.primaryKey).toBeTruthy();
    });

    testColumnCannotBeNull("name");
    testColumnCannotBeNull("rarity");
    testColumnCannotBeNull("pattern");
    function testColumnCannotBeNull(columnName)
    {
        test(`Column ${columnName} cannot be null.`, () => {
            expect(columns[columnName].allowNull).toBeFalsy();
        })
    }
    
});

// =========================
// =====PROPERTY EXISTS=====
// =========================
/*
describe("Model properties.", () => {
    const PATTERN_TO_SAVE = {
        name: "somename", 
        type: "sometype",
        hatchTime: 99
    };
    let savedPattern;
    beforeEach(async() => {
        await Pattern.create(PATTERN_TO_SAVE);
        savedPattern = await Pattern.findOne();
    });
    
    testPropertyExists("type");
    testPropertyExists("name");
    testPropertyExists("hatchTime");
    function testPropertyExists(propertyName)
    {
        test(`Property ${propertyName} exists.`, () => {
            expect(savedPattern[propertyName]).toBe(PATTERN_TO_SAVE[propertyName]);
        });
    }
});


// =============================
// =====PROPERTY ATTRIBUTES=====
// =============================

test("Property name is required.", async() => {
    await expect(
        Pattern.create({type: "some type", hatch_time: 99 })
    ).rejects.toThrow();
});

test("Property type is required.", async() => {
    await expect(
        Pattern.create({name: "some name", hatch_time: 99 })
    ).rejects.toThrow();
});

test("Property hatch_time is optional.", async() => {
    await Pattern.create({ name: "withNullTime", type: "some type" });
    const SAVED_PATTERN = 
        await Pattern.findOne({where: {name: "withNullTime"}});
    expect(SAVED_PATTERN).toBeDefined();
    expect(SAVED_PATTERN.name).toBe("withNullTime");
    expect(SAVED_PATTERN.type).toBe("some type");
    expect(SAVED_PATTERN.hatch_time).toBeUndefined();
});*/