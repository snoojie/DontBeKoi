import { Sequelize } from "sequelize";

export const DATABASE_URL = "postgres://postgres:478963@localhost:5432/dontbekoitest";

export async function dropAllTables(): Promise<void>
{
    let sequelize = new Sequelize(DATABASE_URL, { logging: false });
    await sequelize.getQueryInterface().dropAllTables();
    await sequelize.close();
}