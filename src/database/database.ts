import { Options, Sequelize } from "sequelize";
import ErrorMessages from "../errorMessages";
import { Config } from "../util/config";
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
            throw new Error(ErrorMessages.DATABASE.ALREADY_RUNNING);
        }

        // get the database URL
        const URL = Config.getDatabaseUrl();

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
            if (URL.indexOf("@localhost") < 0)
            {
                options.dialectOptions = {
                    ssl: {
                        require: true,
                        rejectUnauthorized: false
                    }
                }
            }

            // create sequelize instance
            sequelize = new Sequelize(URL, options);

            // we run authetnicate because creating a sequelize instance
            // does not check if user, database name, etc, are valid
            await sequelize.authenticate();
        }
        catch(error)
        {
            throw new RethrownError(
                ErrorMessages.DATABASE.FAILED_CONNECTION + " " + URL,
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