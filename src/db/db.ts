import { initPattern } from "./pattern";
import { initUser } from "./user";

export async function dbStart()
{
    await initPattern();
    await initUser();
}