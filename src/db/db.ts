import { Options, Sequelize } from "sequelize";
import Config from "../util/config";
import RethrownError from "../util/rethrownError";
import PatternDal from "./pattern";
import UserDal from "./user";

let sequelize: Sequelize | undefined;

const db = {

    /**
     * Initialize the database.
     */
    start: async function(): Promise<void>
    {
        // if the db is already running,
        // there is nothing to do
        if (sequelize)
        {
            throw new Error(
                "The database has already started. To restart it, call stop() first."
            );
        }

        // get the database URL
        let dbUrl: string;
        try
        {
            dbUrl = Config.getDatabaseUrl();
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
            if (dbUrl.indexOf("@localhost") < 0)
            {
                options.dialectOptions = {
                    ssl: {
                        require: true,
                        rejectUnauthorized: false
                    }
                }
            }

            // create sequelize instance
            sequelize = new Sequelize(dbUrl, options);

            // we run authetnicate because creating a sequelize instance
            // does not check if user, database name, etc, are valid
            await sequelize.authenticate();
        }
        catch(error)
        {
            throw new RethrownError(
                `Could not connect to database. ` +
                `Could the database URL be wrong? ${dbUrl}`, 
                error
            );
        }

        // init the tables
        for (const DAL of [UserDal, PatternDal])
        {
            try
            {
                // note we already know sequelize is defined
                // as this was set up in the caller function db.start()
                await DAL.init(sequelize!);
            }
            catch(error)
            {
                throw new RethrownError(
                    `Could not start the database. Error initiailizing ${DAL.name} table.`, 
                    error
                );
            }
        }
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

export default db;