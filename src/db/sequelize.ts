import { Sequelize } from "sequelize";

export default new Sequelize({
    dialect: "sqlite",
    storage: "./dontbekoi.db",
    logging: false
});