// ensure the database being used in test is the test database
require("dotenv").config();
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;