module.exports = {

    expectErrorAsync: async function (promise, errorType, errorMessage)
    {
        await expect(promise).rejects.toThrow(errorType);
        await expect(promise).rejects.toThrow(errorMessage);
    },

    expectError: function(methodToTest, errorType, errorMessage)
    {
        expect.assertions(2);
        try
        {
            methodToTest();
        }
        catch(error)
        {
            expect(error).toBeInstanceOf(errorType);
            expect(error.message).toBe(errorMessage);
        }
    }

};