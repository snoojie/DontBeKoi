import UserDal from "../../src/db/user";
import { DataTypes, QueryInterface, QueryTypes, Sequelize } from "sequelize";

let sequelize: Sequelize;
let queryInterface: QueryInterface;

beforeEach(async () => {
    sequelize = new Sequelize(
        "postgres://postgres:478963@localhost:5432/dontbekoitest", { logging: false }
    );
    queryInterface = sequelize.getQueryInterface();
    await queryInterface.dropAllTables();
});

afterEach(async () => {
    if (sequelize)
    {
        await queryInterface.dropAllTables();
        await sequelize.close();
    }
})

test("Initializing users will create Users table when it does not already exist.", async () => {
    await UserDal.init(sequelize);
    await expectUsersTableExists();
});

test("Users table has a name column.", async () => {
    await UserDal.init(sequelize);
    let columns = await getColumns();
    expect(columns).toContain("name");
});

test("Users table has a discord ID column.", async () => {
    await UserDal.init(sequelize);
    let columns = await getColumns();
    expect(columns).toContain("discordId");
});

test("Users table has a spreadsheet ID column.", async () => {
    await UserDal.init(sequelize);
    let columns = await getColumns();
    expect(columns).toContain("spreadsheetId");
});

describe("Create User table", () => {

    beforeEach(async () => {
        await queryInterface.createTable("Users", { "name" : DataTypes.STRING });
    })

    test("Initializing users will not create Users table when it already exists.", async () => {
        await UserDal.init(sequelize);
        await expectUsersTableExists();
    });

    test("Initializing users will not destroy data in Users table.", async () => {
        await queryInterface.bulkInsert("Users", [{ name: "somename" }]);
        await UserDal.init(sequelize);
        let users = await getUsers();
        expect(users.length).toBe(1);
        expect(users[0].name).toBe("somename");
    });
});

async function expectUsersTableExists()
{
    let tables: any[] | null = await sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_name='Users'",
        { 
            type: QueryTypes.SELECT, 
            plain: true,
            raw: true 
        }
    );
    expect(tables!.length).toBe(1);
}

async function getUsers(): Promise<any[]>
{
    let users: any[] = [];
    let tables: any[] | null = await sequelize.query(
        'SELECT name FROM "Users"',
        { 
            type: QueryTypes.SELECT,
            raw: true 
        }
    );
    if (tables)
    {
        users = tables;
    }
    return users;
}

async function getColumns()
{
    return Object.keys(await queryInterface.describeTable("Users"));
}