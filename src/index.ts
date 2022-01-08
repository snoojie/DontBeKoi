import * as dotenv from "dotenv";

// init environment variables
dotenv.config();

import { ExtendedClient } from "./structures/client/extendedClient";

let client = new ExtendedClient();
client.start();