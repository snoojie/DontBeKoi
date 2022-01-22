/**
 * Sleep for a certain amount of time.
 * @param ms How long to sleep in milliseconds.
 * @returns after the provided ms time.
 */
export function sleep(ms: number): Promise<void>
{
    return new Promise(resolve => setTimeout(resolve, ms));
}