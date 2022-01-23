/**
 * Sleep for a certain amount of time.
 * @param ms How long to sleep in milliseconds.
 * @returns after the provided ms time.
 */
export function sleep(ms: number): Promise<void>
{
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Checks if the provided object is a string with at least one character.
 * @param object object to check if a defined string
 * @returns boolean
 */
export function isDefinedString(object: string): boolean
{
    return object !== undefined && typeof object === "string" && object !== "";
}