//import * as dotenv from "dotenv";
import { ExtendedClient } from "./extendedClient";

// init environment variables
//dotenv.config();

let client: ExtendedClient = ExtendedClient.getInstance();
client.start()
    .catch(console.error);