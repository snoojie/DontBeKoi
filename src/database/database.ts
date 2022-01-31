import { Options, Sequelize } from "sequelize";
import Config from "../util/config";
import RethrownError from "../util/rethrownError";
import initModels from "./initModels";

let sequelize: Sequelize | undefined;

const Database = {

    /**
     * Initialize the database.
     */
    start: async function(): Promise<void>
    {
        // if the database is already running,
        // there is nothing to do
        if (sequelize)
        {
            throw new Error(
                "The database has already started. To restart it, call stop() first."
            );
        }

        // get the database URL
        let url: string;
        try
        {
            url = Config.getDatabaseUrl();
        }
        catch(error)
        {
            throw new RethrownError(
                "Could not connect to the database. " +
                "Could not get the database URL from config.",
                error
            )
        }

        // connect to database
        try
        {
            
            // prevent sql queries in console
            let options: Options = {   

                // prevent logging sql queries to the console
                logging: false,

                // prevent needing quotes on table names
                quoteIdentifiers: false,
                
                define: { underscored: true }
            };

            // if using heroku, use ssl
            if (url.indexOf("@localhost") < 0)
            {
                options.dialectOptions = {
                    ssl: {
                        require: true,
                        rejectUnauthorized: false
                    }
                }
            }

            // create sequelize instance
            sequelize = new Sequelize(url, options);

            // we run authetnicate because creating a sequelize instance
            // does not check if user, database name, etc, are valid
            await sequelize.authenticate();
        }
        catch(error)
        {
            throw new RethrownError(
                `Could not connect to database. ` +
                `Could the database URL be wrong? ${url}`, 
                error
            );
        }

        await initModels(sequelize);
    },

    stop: async function() 
    {
        if (sequelize)
        {
            await sequelize.close();
            sequelize = undefined;
        }
    }
}

export default Database;