module.exports = {

    testName: function(command, expectedName)
    {
        test(`Name is ${expectedName}.`, () => {
            expect(command.name).toBe(expectedName);
        });
    },

    testDescription: function(command, expectedDescription)
    {
        test("Has a description.", () => {
            expect(command.description).toBe(expectedDescription);
        });
    },

    testResponseIsPublic: function(command)
    {        
        test("Response is public.", () => {
            expect(!command.isPrivate).toBeTruthy();
        });
    },

    testResponseIsPrivate: function(command)
    {        
        test("Response is private.", () => {
            expect(command.isPrivate).toBeTruthy();
        });
    },

    testOptionsCount: function(command, expectedCount)
    {
        test(`There are ${expectedCount} options.`, () => {
            if (expectedCount)
            {
                expect(command.options).toBeDefined();
                expect(command.options.length).toBe(expectedCount);
            }
            else
            {
                expect(!command.options || command.options == [])
                    .toBeTruthy();
            }
        });
    },

    testStringOption(option, expectedName, expectedDescription)
    {
        test(`Has string option ${expectedName}.`, () => {
            expect(option.name).toBe(expectedName);
            expect(option.description).toBe(expectedDescription);
            expect(!option.type || option.type == "string").toBeTruthy();
        });
    },
    
    testNumberOption(option, expectedName, expectedDescription)
    {
        test(`Has number option ${expectedName}.`, () => {
            expect(option.name).toBe(expectedName);
            expect(option.description).toBe(expectedDescription);
            expect(option.type == "number").toBeTruthy();
        });
    },


}