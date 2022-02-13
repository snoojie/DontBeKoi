module.exports = {
    expectErrorAsync: async function (promise, errorType, errorMessage)
    {
        await expect(promise).rejects.toThrow(errorType);
        await expect(promise).rejects.toThrow(errorMessage);
    }
};