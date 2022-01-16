import { ExtendedClient } from "./extendedClient";

let client: ExtendedClient = ExtendedClient.getInstance();
client.start()
    .catch(console.error);