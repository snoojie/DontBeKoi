const EnhancedError = require("../../src/util/enhancedError").default;

// ==============
// =====NAME=====
// ==============

test("Name is EnhancedError.", () => {
    const ERROR = new EnhancedError("some error");
    expect(ERROR.name).toBe("EnhancedError");
});

test("Name of extended class is that class's name.", () => {
    class MyTestError extends EnhancedError {}
    const ERROR = new MyTestError("some error");
    expect(ERROR.name).toBe("MyTestError");
});

// ====================
// =====TYPE ERROR=====
// ====================

test("Is of type error.", () => {
    const ERROR = new EnhancedError("some error");
    expect(ERROR).toBeInstanceOf(Error);
});

// =================
// =====MESSAGE=====
// =================

test("Has a message.", () => {
    const ERROR = new EnhancedError("some error");
    expect(ERROR.message).toBe("some error");
});

// ====================
// =====STACKTRACE=====
// ====================

test("Has a stacktrace.", () => {
    const ERROR = new EnhancedError("some error");
    expect(ERROR.stack).toBeDefined();
    const STACKTRACE_BY_LINE = ERROR.stack.split("\n");
    expect(STACKTRACE_BY_LINE.length).toBeGreaterThanOrEqual(2);
    expect(STACKTRACE_BY_LINE[0]).toEqual("EnhancedError: some error");
    for (let i=1; i<STACKTRACE_BY_LINE.length; i++)
    {
        expectPartOfStacktrace(STACKTRACE_BY_LINE[i]);
    }
});

test("Initializing with an error of type string appends that string to the stacktrace.",
    () => 
{    
    const ERROR = new EnhancedError("some error", "original problem");
    expect(ERROR.stack).toBeDefined();
    const STACKTRACE_BY_LINE = ERROR.stack.split("\n");
    expect(STACKTRACE_BY_LINE.length).toBeGreaterThanOrEqual(3);
    expect(STACKTRACE_BY_LINE[0]).toEqual("EnhancedError: some error");
    for (let i=1; i<STACKTRACE_BY_LINE.length-1; i++)
    {
        expectPartOfStacktrace(STACKTRACE_BY_LINE[i]);
    }
    expect(STACKTRACE_BY_LINE[STACKTRACE_BY_LINE.length-1])
        .toEqual("original problem");
});

test("Initializing with an error of type error includes that error's stack trace.",
    () => 
{    
    const ERROR = new EnhancedError("some error", new Error("original problem"));
    expect(ERROR.stack).toBeDefined();
    const STACKTRACE_BY_LINE = ERROR.stack.split("\n");
    expect(STACKTRACE_BY_LINE.length).toBeGreaterThanOrEqual(4);
    expect(STACKTRACE_BY_LINE[0]).toEqual("EnhancedError: some error");
    expectPartOfStacktrace(STACKTRACE_BY_LINE[1]);
    expect(STACKTRACE_BY_LINE[2]).toEqual("Error: original problem");
    for (let i=3; i<STACKTRACE_BY_LINE.length; i++)
    {
        expectPartOfStacktrace(STACKTRACE_BY_LINE[i]);
    }
});

test("Chaining EnhancedErrors includes all stacktraces.", () => {
    const ERROR = new EnhancedError(
        "some error", 
        new EnhancedError("middle error", new Error("original"))
    );
    expect(ERROR.stack).toBeDefined();
    const STACKTRACE_BY_LINE = ERROR.stack.split("\n");
    expect(STACKTRACE_BY_LINE.length).toBeGreaterThanOrEqual(6);
    expect(STACKTRACE_BY_LINE[0]).toEqual("EnhancedError: some error");
    expectPartOfStacktrace(STACKTRACE_BY_LINE[1]);
    expect(STACKTRACE_BY_LINE[2]).toEqual("EnhancedError: middle error");
    expectPartOfStacktrace(STACKTRACE_BY_LINE[3]);
    expect(STACKTRACE_BY_LINE[4]).toEqual("Error: original");
    for (let i=5; i<STACKTRACE_BY_LINE.length; i++)
    {
        expectPartOfStacktrace(STACKTRACE_BY_LINE[i]);
    }
});

function expectPartOfStacktrace(line)
{
    // match a stacktrace line such as one of the following:
    //    at Object.<anonymous> (C:\dontbekoi\tests\util\enhancedError.test.js:81:13) 
    //    at new Promise (<anonymous>)
    expect(line).toMatch(/^    at [^\()]+\([^\)]+\)$/);
}