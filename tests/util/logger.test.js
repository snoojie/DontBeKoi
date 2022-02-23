const Logger = require("../../src/util/logger").default;
const EnhancedError = require("../../src/util/enhancedError").default;
const { Database } = require("../../src/database/database");
const { Koi } = require("../../src/database/models/koi");

beforeEach(() => {
    console.log = jest.fn();
    process.stdout.write = jest.fn();
});

// =============
// =====LOG=====
// =============

test("Log.", () => {
    Logger.log("some message");
    expectCounts(1, 0);
    expectLog(0, "some message");
});

// ===============
// =====ERROR=====
// ===============

test("Error with a string.", () => {
    Logger.error("some message");
    expectCounts(1, 0);
    expectErrorDescriptionLog(0, "some message");
});

test("Error with an error object.", () => {
    const ERROR = new Error("some error");
    Logger.error(ERROR);
    const STACKTRACE_BY_LINE = ERROR.stack.split("\n");

    expectCounts(STACKTRACE_BY_LINE.length, 0);
    expectErrorDescriptionLog(0, "Error: some error");

    for (let i=1; i<STACKTRACE_BY_LINE.length; i++)
    {
        expectStacktraceLineLog(i, STACKTRACE_BY_LINE[i]);
    }
});

test("Error with an EnhancedError.", () => {
    const ERROR = new EnhancedError("enhanced error message", new Error("some error"));
    Logger.error(ERROR);
    const STACKTRACE_BY_LINE = ERROR.stack.split("\n");

    expectCounts(STACKTRACE_BY_LINE.length, 0);
    expectErrorDescriptionLog(0, "EnhancedError: enhanced error message");
    expectStacktraceLineLog(1, STACKTRACE_BY_LINE[1]);
    expectErrorDescriptionLog(2, "Error: some error");

    for (let i=3; i<STACKTRACE_BY_LINE.length; i++)
    {
        expectStacktraceLineLog(i, STACKTRACE_BY_LINE[i]);
    }
});

describe("Test with database.", () => {

    afterAll(async() => await Database.stop());

    test("Error with a Sequelize DatabaseError object.", async() => {
        await Database.start()

        // create the sequelize database error
        let error;
        try
        {
            await Koi.create({
                name: "somekoi", patternName: "somepattern", rarity: "Common"
            });
        }
        catch(e)
        {
            error = e;
        }
        expect(error).toBeDefined();

        // log the error
        Logger.error(error);

        // test it was logged correctly
        /* example log:
        SequelizeForeignKeyConstraintError: insert or update on table "kois" violates foreign key constraint "kois_pattern_name_fkey"
        SQL: INSERT INTO kois (id,name,rarity,pattern_name,created_at,updated_at) VALUES (DEFAULT,$1,$2,$3,$4,$5) RETURNING id,name,rarity,pattern_name,created_at,updated_at;
        SQL parameters: [
          "somekoi",
          "Common",
          "somepattern",
          "2022-02-23 00:45:12.294 +00:00",
          "2022-02-23 00:45:12.294 +00:00"
        ]
            at Query.run (C:\dontbekoi\node_modules\sequelize\lib\dialects\postgres\query.js:76:25)
            ....more at... blahblah....
        */
        const STACKTRACE_BY_LINE = error.stack.split("\n");
        
        expect(console.log.mock.calls.length).toBeGreaterThanOrEqual(10);
        expect(process.stdout.write.mock.calls.length).toBe(0);
        expectErrorDescriptionLog(
            0, 
            'SequelizeForeignKeyConstraintError: insert or update on table "kois" ' +
            'violates foreign key constraint "kois_pattern_name_fkey"'
        );
        expectErrorDescriptionLog(
            1, 
            'SQL: INSERT INTO kois ' +
            '(id,name,rarity,pattern_name,created_at,updated_at) VALUES ' +
            '(DEFAULT,$1,$2,$3,$4,$5) RETURNING ' +
            'id,name,rarity,pattern_name,created_at,updated_at;'
        );
        expectErrorDescriptionLog(
            2, 
            'SQL parameters: [\n' +
            '  "somekoi",\n  "Common",\n  "somepattern",\n' +
            `  "${error.parameters[3]}",\n  "${error.parameters[4]}"\n` +
            "]"
        );

        for (let i=9; i<STACKTRACE_BY_LINE.length; i++)
        {
            expectStacktraceLineLog(i, STACKTRACE_BY_LINE[i]);
        }
    });
});

// =====================
// =====LOG PARTIAL=====
// =====================

test("Log partial without specifying done does not print newline.", () => {
    Logger.logPartial("some message");
    expectCounts(0, 1);
    expectPartialLog(0, "some message");
});

test("Log partial when setting done to false does not print newline.", () => {
    Logger.logPartial("some message", false);
    expectCounts(0, 1);
    expectPartialLog(0, "some message");
});

test("Log partial when setting done to true prints newline.", () => {
    Logger.logPartial("some message", true);
    expectCounts(0, 2);
    expectPartialLog(0, "some message");
    expectPartialLog(1, "\n");
});

test("Can log several partials.", () => {
    Logger.logPartial("some message");
    Logger.logPartial("another message", false);
    Logger.logPartial("more!!");
    Logger.logPartial("Done now.", true);
    expectCounts(0, 5);
    expectPartialLog(0, "some message");
    expectPartialLog(1, "another message");
    expectPartialLog(2, "more!!");
    expectPartialLog(3, "Done now.");
    expectPartialLog(4, "\n");
});

test("Newline printed before logging if previous partial log not done.", () => {
    Logger.logPartial("some message");
    Logger.log("Interrupted the message");
    expectCounts(1, 2);
    expectPartialLog(0, "some message");
    expectPartialLog(1, "\n");
    expectLog(0, "Interrupted the message");
});

test("No extra newline printed before logging if previous partial log done.", () => {
    Logger.logPartial("some message", true);
    Logger.log("no interruption");
    expectCounts(1, 2);
    expectPartialLog(0, "some message");
    expectPartialLog(1, "\n");
    expectLog(0, "no interruption");
});

test("Newline printed before error if previous partial log not done.", () => {
    Logger.logPartial("some message");
    Logger.error("Interrupted the message");
    expectCounts(1, 2);
    expectPartialLog(0, "some message");
    expectPartialLog(1, "\n");
    expectErrorDescriptionLog(0, "Interrupted the message");
});

test("No extra newline printed before error if previous partial log done.", () => {
    Logger.logPartial("some message", true);
    Logger.error("no interruption");
    expectCounts(1, 2);
    expectPartialLog(0, "some message");
    expectPartialLog(1, "\n");
    expectErrorDescriptionLog(0, "no interruption");
});

function expectCounts(consoleLogCount, processStdoutWriteCount)
{
    expect(console.log.mock.calls.length).toBe(consoleLogCount);
    expect(process.stdout.write.mock.calls.length).toBe(processStdoutWriteCount);
}

function expectLog(callIndex, message)
{
    expect(console.log.mock.calls[callIndex][0]).toBe("\x1b[32m%s\x1b[0m"); //green
    expect(console.log.mock.calls[callIndex][1]).toBe(message);
}

function expectPartialLog(callIndex, message)
{
    const EXPECTED = message=="\n" ? "\n" : `\x1b[32m${message}\x1b[0m`; //green
    expect(process.stdout.write.mock.calls[callIndex][0]).toBe(EXPECTED);
}

function expectErrorDescriptionLog(callIndex, line)
{
    // red
    expect(console.log.mock.calls[callIndex][0]).toBe("\x1b[31m%s\x1b[0m");

    expect(console.log.mock.calls[callIndex][1]).toBe(line);
}

function expectStacktraceLineLog(callIndex, line)
{
    // red grey
    expect(console.log.mock.calls[callIndex][0]).toBe("\x1b[38;5;131m%s\x1b[0m");

    expect(console.log.mock.calls[callIndex][1]).toBe(line);
}