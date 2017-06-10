'use strict';

const {describe, it, beforeEach} = require('mocha-sugar-free');
const {assert} = require('chai');
const through = require('through2');

const Wait = require('./Wait');
const JSONBird = require('../lib/JSONBird');
const RPCRequestError = require('../lib/RPCRequestError');

const FINISH = Symbol('FINISH');
const delay = amount => new Promise(resolve => setTimeout(resolve, amount));

describe('JSONBird handling pings', () => {
    let readStream = null;
    let writeStream = null;
    let writeEvents = null;
    let writeWait = null;
    let previousTimerId = 0;
    let timerCalls = null;
    let pingEvents = null;
    let pingEventWait = null;

    const setTimeout = (func, timeout) => {
        const id = ++previousTimerId;
        timerCalls.push({set: true, func: func.bind(null), timeout, id});

        return id;
    };
    const clearTimeout = id => {
        timerCalls.push({clear: true, id});
    };

    const addPingEvents = rpc => {
        rpc.on('pingSuccess', delay => {
            pingEvents.push({success: true, delay});
            pingEventWait.advance();
        });
        rpc.on('pingFail', (consecutiveFails, error) => {
            pingEvents.push({fail: true, consecutiveFails, error});
            pingEventWait.advance();
        });
    };

    beforeEach(() => {
        writeEvents = [];
        writeWait = new Wait();
        timerCalls = [];

        readStream = through.obj();

        writeStream = through.obj(
            (data, encoding, callback) => {
                writeEvents.push(data);
                writeWait.advance();
                callback();
            },
            () => {
                writeWait.advance();
                writeEvents.push(FINISH);
            }
        );

        pingEventWait = new Wait();
        pingEvents = [];
    });

    it('should set default options', () => {
        const rpc = new JSONBird();
        assert.isTrue(rpc.pingReceive);
        assert.isFalse(rpc.isSendingPings);
        assert.strictEqual(rpc.pingMethod, 'jsonbird.ping');
        assert.strictEqual(rpc.pingInterval, 2000);
        assert.strictEqual(rpc.pingTimeout, 1000);
    });

    it('should not send pings by default', () => {
        const rpc = new JSONBird();
        assert.isFalse(rpc.isSendingPings);
    });

    it('should receive pings by default', () => {
        const rpc = new JSONBird();
        assert.isTrue(rpc.pingReceive);

        return rpc.callLocal('jsonbird.ping').then(result => assert.isTrue(result));
    });

    it('should not register the ping method if pingReceive=false', () => {
        const rpc = new JSONBird({pingReceive: false});
        assert.isFalse(rpc.pingReceive);

        return rpc.callLocal('jsonbird.ping').then(
            () => assert(false),
            error => assert.strictEqual(error.code, -32601) // not found
        );
    });

    it('should send a ping periodically', () => {
        let now = 0;
        const rpc = new JSONBird({
            sessionId: null,
            writableMode: 'object',
            readableMode: 'object',
            pingInterval: 2345,
            pingTimeout: 0, // disable timeout in the ping call (simplifies this unit test)
            pingNow: () => now,
            setTimeout,
            clearTimeout,
        });

        rpc.on('protocolError', error => console.error(error));
        addPingEvents(rpc);
        readStream.pipe(rpc);
        rpc.pipe(writeStream);

        assert.lengthOf(timerCalls, 0);

        rpc.startPinging();
        assert.lengthOf(timerCalls, 1);
        assert.isTrue(timerCalls[0].set);
        assert.strictEqual(timerCalls[0].timeout, 2345);

        now = 1000000;
        timerCalls[0].func(); // it is time to send a ping

        return writeWait.wait(1).then(() => {
            assert.lengthOf(writeEvents, 1);

            assert.deepEqual(writeEvents[0], {
                jsonrpc: '2.0',
                method: 'jsonbird.ping',
                params: [],
                id: 0,
            });

            assert.lengthOf(pingEvents, 0);

            now = 1009876;
            readStream.write({jsonrpc: '2.0', result: true, id: 0});

            return pingEventWait.wait(1);
        }).then(() => {
            assert.lengthOf(pingEvents, 1);
            assert.isTrue(pingEvents[0].success);
            assert.strictEqual(pingEvents[0].delay, 9876);

            assert.lengthOf(timerCalls, 2);
            assert.isTrue(timerCalls[1].set);
            assert.strictEqual(timerCalls[1].timeout, 2345);

            now = 1020000;
            timerCalls[1].func(); // it is time to send a ping

            return writeWait.wait(1);
        }).then(() => {
            assert.lengthOf(writeEvents, 2);

            assert.deepEqual(writeEvents[1], {
                jsonrpc: '2.0',
                method: 'jsonbird.ping',
                params: [],
                id: 1,
            });

            assert.lengthOf(pingEvents, 1);

            now = 1029080;
            readStream.write({jsonrpc: '2.0', result: true, id: 1});

            return pingEventWait.wait(1);
        }).then(() => {
            assert.lengthOf(pingEvents, 2);
            assert.isTrue(pingEvents[1].success);
            assert.strictEqual(pingEvents[1].delay, 9080);

            assert.lengthOf(timerCalls, 3);
            assert.isTrue(timerCalls[2].set);
            assert.strictEqual(timerCalls[2].timeout, 2345);

            rpc.stopPinging();
            assert.lengthOf(timerCalls, 4);
            assert.isTrue(timerCalls[3].clear);
            assert.strictEqual(timerCalls[3].id, timerCalls[2].id);
        });
    });

    it('should handle ping failures', () => {
        const rpc = new JSONBird({
            sessionId: null,
            writableMode: 'object',
            readableMode: 'object',
            pingInterval: 4567,
            pingTimeout: 0, // disable timeout in the ping call (simplifies this unit test)
            setTimeout,
            clearTimeout,
        });

        rpc.on('protocolError', error => console.error(error));
        addPingEvents(rpc);
        readStream.pipe(rpc);
        rpc.pipe(writeStream);

        rpc.startPinging();
        timerCalls[0].func(); // it is time to send a ping

        return writeWait.wait(1).then(() => {
            assert.lengthOf(writeEvents, 1);

            assert.deepEqual(writeEvents[0], {
                jsonrpc: '2.0',
                method: 'jsonbird.ping',
                params: [],
                id: 0,
            });

            readStream.write({jsonrpc: '2.0', error: {code: 0, message: 'A simple error'}, id: 0});

            return pingEventWait.wait(1);
        }).then(() => {
            assert.lengthOf(pingEvents, 1);
            assert.isTrue(pingEvents[0].fail);
            assert.strictEqual(pingEvents[0].consecutiveFails, 1);
            assert.instanceOf(pingEvents[0].error, RPCRequestError);
            assert.strictEqual(pingEvents[0].error.message, 'A simple error');

            assert.lengthOf(timerCalls, 2);
            assert.isTrue(timerCalls[1].set);
            assert.strictEqual(timerCalls[1].timeout, 4567);
            timerCalls[1].func(); // it is time to send a ping

            return writeWait.wait(1);
        }).then(() => {
            assert.lengthOf(writeEvents, 2);

            assert.deepEqual(writeEvents[1], {
                jsonrpc: '2.0',
                method: 'jsonbird.ping',
                params: [],
                id: 1,
            });

            readStream.write({jsonrpc: '2.0', error: {code: 0, message: 'A simple error'}, id: 1});

            return pingEventWait.wait(1);
        }).then(() => {
            assert.lengthOf(pingEvents, 2);
            assert.isTrue(pingEvents[1].fail);
            assert.strictEqual(pingEvents[1].consecutiveFails, 2);
            assert.instanceOf(pingEvents[1].error, RPCRequestError);
            assert.strictEqual(pingEvents[1].error.message, 'A simple error');

            assert.lengthOf(timerCalls, 3);
            assert.isTrue(timerCalls[2].set);
            assert.strictEqual(timerCalls[2].timeout, 4567);
            timerCalls[2].func(); // it is time to send a ping

            return writeWait.wait(1);
        }).then(() => {
            readStream.write({jsonrpc: '2.0', error: {code: 0, message: 'A simple error'}, id: 2});

            return pingEventWait.wait(1);
        }).then(() => {
            assert.lengthOf(pingEvents, 3);
            assert.isTrue(pingEvents[2].fail);
            assert.strictEqual(pingEvents[2].consecutiveFails, 3);

            timerCalls[3].func(); // it is time to send a ping

            return writeWait.wait(1);
        }).then(() => {
            readStream.write({jsonrpc: '2.0', result: true, id: 3});

            return pingEventWait.wait(1); // stuck
        }).then(() => {
            assert.lengthOf(pingEvents, 4);
            assert.isTrue(pingEvents[3].success);

            timerCalls[4].func(); // it is time to send a ping

            return writeWait.wait(1);
        }).then(() => {
            readStream.write({jsonrpc: '2.0', error: {code: 0, message: 'A simple error'}, id: 4});

            return pingEventWait.wait(1);
        }).then(() => {
            assert.lengthOf(pingEvents, 5);
            assert.isTrue(pingEvents[4].fail);
            assert.strictEqual(pingEvents[4].consecutiveFails, 1);

            rpc.stopPinging();
        });
    });

    it('should handle ping timeouts', () => {
        const rpc = new JSONBird({
            sessionId: null,
            writableMode: 'object',
            readableMode: 'object',
            pingInterval: 4567,
            pingTimeout: 1234,
            setTimeout,
            clearTimeout,
        });

        rpc.on('protocolError', error => console.error(error));
        addPingEvents(rpc);
        readStream.pipe(rpc);
        rpc.pipe(writeStream);

        rpc.startPinging();
        timerCalls[0].func(); // it is time to send a ping

        return writeWait.wait(1).then(() => {
            assert.lengthOf(timerCalls, 2);
            assert.isTrue(timerCalls[1].set);
            assert.strictEqual(timerCalls[1].timeout, 1234);
            timerCalls[1].func(); // the call took too long

            return pingEventWait.wait(1);
        }).then(() => {
            assert.lengthOf(pingEvents, 1);
            assert.isTrue(pingEvents[0].fail);
            assert.strictEqual(pingEvents[0].consecutiveFails, 1);
            assert.instanceOf(pingEvents[0].error, RPCRequestError);
            assert.match(pingEvents[0].error.message, /timed.*out/i);

            // should have scheduled another ping
            assert.lengthOf(timerCalls, 3);
            assert.isTrue(timerCalls[2].set);
            assert.strictEqual(timerCalls[2].timeout, 4567);

            timerCalls[2].func(); // it is time to send a ping

            return writeWait.wait(1);
        }).then(() => {
            assert.lengthOf(timerCalls, 4);
            assert.isTrue(timerCalls[3].set);
            assert.strictEqual(timerCalls[3].timeout, 1234);

            readStream.write({jsonrpc: '2.0', result: true, id: 1});

            return pingEventWait.wait(1);
        }).then(() => {
            assert.lengthOf(pingEvents, 2);
            assert.isTrue(pingEvents[1].success);

            assert.lengthOf(timerCalls, 6);
            assert.isTrue(timerCalls[4].clear); // should have cleared the call timeout timer
            assert.strictEqual(timerCalls[4].id, timerCalls[4].id);

            assert.isTrue(timerCalls[5].set);
            assert.strictEqual(timerCalls[5].timeout, 4567);

            rpc.stopPinging();
        });
    });

    it('should reset pingConsecutiveFails when resetPingStatistics() is called', () => {
        const rpc = new JSONBird({
            sessionId: null,
            writableMode: 'object',
            readableMode: 'object',
            pingInterval: 4567,
            pingTimeout: 1234,
            setTimeout,
            clearTimeout,
        });

        rpc.on('protocolError', error => console.error(error));
        addPingEvents(rpc);
        readStream.pipe(rpc);
        rpc.pipe(writeStream);

        rpc.startPinging();
        timerCalls[0].func(); // it is time to send a ping

        return writeWait.wait(1).then(() => {
            assert.strictEqual(timerCalls[1].timeout, 1234);
            timerCalls[1].func(); // the call took too long

            return pingEventWait.wait(1);
        }).then(() => {
            assert.lengthOf(pingEvents, 1);
            assert.strictEqual(pingEvents[0].consecutiveFails, 1);

            assert.strictEqual(timerCalls[2].timeout, 4567);
            timerCalls[2].func(); // it is time to send a ping

            return writeWait.wait(1);
        }).then(() => {
            rpc.resetPingStatistics();

            assert.strictEqual(timerCalls[3].timeout, 1234);
            timerCalls[3].func(); // the call took too long

            return pingEventWait.wait(1);
        }).then(() => {
            assert.lengthOf(pingEvents, 2);
            assert.strictEqual(pingEvents[0].consecutiveFails, 1);
            rpc.stopPinging();
        });
    });

    it('should stop pinging on finish', () => {
        const rpc = new JSONBird({
            sessionId: null,
            writableMode: 'object',
            readableMode: 'object',
            pingTimeout: 0, // disable timeout in the ping call (simplifies this unit test)
            setTimeout,
            clearTimeout,
        });

        rpc.on('protocolError', error => console.error(error));
        addPingEvents(rpc);
        readStream.pipe(rpc);
        rpc.pipe(writeStream);

        rpc.startPinging();

        // emits 'finish' on the writable stream
        rpc.end();

        return delay(5).then(() => {
            assert.isFalse(rpc.isSendingPings);
            assert.lengthOf(timerCalls, 2);
            assert.isTrue(timerCalls[1].clear);
            assert.strictEqual(timerCalls[1].id, timerCalls[0].id);

            assert.throws(() => rpc.startPinging(), /stream.*finish/i);
        });
    });

    it('should stop pinging on end', () => {
        const rpc = new JSONBird({
            sessionId: null,
            writableMode: 'object',
            readableMode: 'object',
            pingTimeout: 0, // disable timeout in the ping call (simplifies this unit test)
            setTimeout,
            clearTimeout,
        });

        rpc.on('protocolError', error => console.error(error));
        addPingEvents(rpc);
        readStream.pipe(rpc);
        rpc.pipe(writeStream);

        rpc.startPinging();

        // emits 'end' on the readable stream
        rpc.push(null);

        return delay(5).then(() => {
            assert.isFalse(rpc.isSendingPings);
            assert.lengthOf(timerCalls, 2);
            assert.isTrue(timerCalls[1].clear);
            assert.strictEqual(timerCalls[1].id, timerCalls[0].id);

            assert.throws(() => rpc.startPinging(), /stream.*end/i);
        });
    });

    it('should not schedule a new ping timer (on resolve) if we have stopped pinging', () => {
        const rpc = new JSONBird({
            sessionId: null,
            writableMode: 'object',
            readableMode: 'object',
            pingTimeout: 0, // disable timeout in the ping call (simplifies this unit test)
            setTimeout,
            clearTimeout,
        });

        rpc.on('protocolError', error => console.error(error));
        addPingEvents(rpc);
        readStream.pipe(rpc);
        rpc.pipe(writeStream);

        rpc.startPinging();
        timerCalls[0].func(); // it is time to send a ping
        rpc.stopPinging(); // the ping rpc call is still pending

        readStream.write({jsonrpc: '2.0', result: true, id: 0});

        return pingEventWait.wait(1).then(() => delay(5)).then(() => {
            assert.isTrue(pingEvents[0].success);
            assert.lengthOf(timerCalls, 1); // should not schedule a new timer
        });
    });

    it('should not schedule a new ping timer (on reject) if we have stopped pinging', () => {
        const rpc = new JSONBird({
            sessionId: null,
            writableMode: 'object',
            readableMode: 'object',
            pingTimeout: 0, // disable timeout in the ping call (simplifies this unit test)
            setTimeout,
            clearTimeout,
        });

        rpc.on('protocolError', error => console.error(error));
        addPingEvents(rpc);
        readStream.pipe(rpc);
        rpc.pipe(writeStream);

        rpc.startPinging();
        timerCalls[0].func(); // it is time to send a ping
        rpc.stopPinging(); // the ping rpc call is still pending

        readStream.write({jsonrpc: '2.0', error: {message: 'foo'}, id: 0});

        return pingEventWait.wait(1).then(() => delay(5)).then(() => {
            assert.isTrue(pingEvents[0].fail);
            assert.lengthOf(timerCalls, 1); // should not schedule a new timer
        });
    });
});
