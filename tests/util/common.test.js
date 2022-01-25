const { isDefinedString } = require("../../src/util/common");

// tests for isDefinedString

test("A string with text is a defined string.", () => {
    expect(isDefinedString("i am a string")).toBeTruthy();
});

test("An empty string is not a defined string.", () => {
    expect(isDefinedString("")).not.toBeTruthy();
});

test("Undefined is not a defined string.", () => {
    expect(isDefinedString(undefined)).not.toBeTruthy();
});

test("Null is not a defined string.", () => {
    expect(isDefinedString(null)).not.toBeTruthy();
});