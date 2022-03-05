module.exports = {

    expectErrorAsync: async function (
        promise, errorType, errorMessage, additionalErrorProperties)
    {
        await expect(promise).rejects.toThrow();
        await promise.catch(error => {
            expect(error).toBeInstanceOf(errorType);
            expect(error.message).toBe(errorMessage);
            if (additionalErrorProperties)
            {
                for (const [PROPERTY, VALUE] of Object.entries(additionalErrorProperties))
                {
                    expect(error[PROPERTY]).toEqual(VALUE);
                }
            }
        });
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