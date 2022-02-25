import { type Options, Sequelize } from "sequelize";
import { Config } from "../util/config";
import EnhancedError from "../util/enhancedError";
import { initUser } from "./models/user";
import { initPattern } from "./models/pattern";
import { initKoi } from "./models/koi";

/**
 * Base error.
 */
export abstract class DatabaseError extends EnhancedError {}

/**
 * Error thrown when the database is started when it is already running.
 */
export class DatabaseAlreadyRunning extends DatabaseError
{
    constructor()
    {
        super("Cannot start the database. It is already running.")
    }
}

/**
 * Error thrown the database URL is either invalid or not set in environment variables.
 */
export class InvalidDatabaseUrl extends DatabaseError
{
    constructor(message: string, error: any)
    {
        super(message, error);
    }
}

let sequelize: Sequelize | undefined;

/**
 * Represents the database. Has two functions: start and stop.
 */
export const Database = {

    /**
     * Initialize the database.
     * @throws DatabaseError if the database is already running.
     * @throws InvalidDatabaseUrl if the database URL is invalid or 
     *         not set in the environment variables.
     */
    start: async function(): Promise<void>
    {
        // if the database is already running,
        // there is nothing to do
        if (sequelize)
        {
            throw new DatabaseAlreadyRunning();
        }

        // get the database URL
        let url;
        try
        {
            url = Config.getDatabaseUrl();
        }
        catch(error)
        {
            throw new InvalidDatabaseUrl(
                "Database URL not set in environment variables.", error
            );
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
            throw new InvalidDatabaseUrl(
                "Could not connect to the database. Could the URL be invalid?", error
            );
        }

        // init the models
        initUser(sequelize);
        initPattern(sequelize);
        initKoi(sequelize);
    
        // create the tables if they don't exist yet
        await sequelize.sync();
    },

    /**
     * Close the connection to the database.
     */
    stop: async function() 
    {
        if (sequelize)
        {
            await sequelize.close();
            sequelize = undefined;
        }
    }
}