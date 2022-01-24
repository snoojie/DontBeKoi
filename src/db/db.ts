import { Options, Sequelize } from "sequelize";
import Config from "../util/config";
import { RethrownError } from "../util/rethrownError";
import UserDal from "./user";

let db = {

    /**
     * Initialize the database.
     */
    init: async function(): Promise<void>
    {
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
        let sequelize: Sequelize;
        try
        {
            
            // prevent sql queries in console
            let options: Options = {   
                logging: false,
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

        // init the User model
        try
        {
            await UserDal.init(sequelize);
        }
        catch(error)
        {
            throw new RethrownError(
                "Could not initialize the database. Error initiailizing User table.", 
                error
            );
        }
        
    }
}

export default db;