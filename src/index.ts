// init environment variables
require("dotenv").config();

import { ExtendedClient } from "./structures/client/extendedClient";

let client = new ExtendedClient();
client.start();