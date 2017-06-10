/* eslint prefer-rest-params: 'off' */
/* eslint max-nested-callbacks: 'off' */
'use strict';

const {describe, it, beforeEach} = require('mocha-sugar-free');
const {assert} = require('chai');
const through = require('through2');

const PromiseFateTracker = require('./PromiseFateTracker');
const Wait = require('./Wait');
const JSONBird = require('../lib/JSONBird');
const RPCRequestError = require('../lib/RPCRequestError');
const RPCResponseError = require('../lib/RPCResponseError');

const FINISH = Symbol('END');
const delay = amount => new Promise(resolve => setTimeout(resolve, amount));
const streamWrite = (stream, data) => new Promise(resolve => stream.write(data, 'utf8', resolve));
const manualPromise = () => {
    const result = {};

    result.promise = new Promise((resolve, reject) => {
        result.resolve = resolve;
        result.reject = reject;
    });

    return result;
};


describe('JSONBird handling object streams', () => {
    let rpc = null;
    let readStream = null;
    let writeStream = null;

    let writeEvents = null;
    let writeWait = null;

    let errorEvents = null;
    let errorWait = null;

    let protocolErrorEvents = null;
    let protocolErrorWait = null;

    let calledReservedMethod = false;

    beforeEach(() => {
        writeEvents = [];
        writeWait = new Wait();
        errorEvents = [];
        errorWait = new Wait();
        protocolErrorEvents = [];
        protocolErrorWait = new Wait();

        rpc = new JSONBird({sessionId: null, writableMode: 'object', readableMode: 'object'});
        rpc.on('error', error => {
            // console.log('error event', error);
            errorEvents.push(error);
            errorWait.advance();
        });

        rpc.on('protocolError', error => {
            // console.log('protocolError event', error);
            protocolErrorEvents.push(error);
            protocolErrorWait.advance();
        });

        const methods = {
            undef() {
                return undefined;
            },
            divide(a, b) {
                assert.strictEqual(this, methods);
                assert.lengthOf(arguments, 2);

                return a / b;
            },
            π() {
                assert.strictEqual(this, methods);
                assert.lengthOf(arguments, 0);

                return 3.1;
            },
            subtract(a, b) {
                assert.strictEqual(this, methods);
                assert.lengthOf(arguments, 2);

                return a - b;
            },
            subtractAsync(a, b) {
                assert.strictEqual(this, methods);
                assert.lengthOf(arguments, 2);

                return delay(5).then(() => a - b);
            },
            sqrt(a) {
                assert.strictEqual(this, methods);
                assert.lengthOf(arguments, 1);

                return Math.sqrt(a);
            },
            divideNamed(params) {
                assert.strictEqual(this, methods);
                assert.lengthOf(arguments, 1);
                assert.sameMembers(Object.getOwnPropertyNames(params), ['dividend', 'divisor']);

                return {quotient: params.dividend / params.divisor};
            },
            throwError(props = {}) {
                const error = Error('A simple error');

                // eslint-disable-next-line prefer-const
                for (let key of Object.keys(props)) {
                    error[key] = props[key];
                }

                throw error;
            },
            rejectAsync(props = {}) {
                return delay(5).then(() => this.throwError(props));
            },
        };

        rpc.methods(methods);

        rpc.method('rpc.foo', () => {
            calledReservedMethod = true;
        });

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
    });

    describe('as a server', () => {
        it('should reply with errors when invalid ', () => Promise.resolve().then(() => {
            readStream.pipe(rpc);
            rpc.pipe(writeStream);

            return Promise.resolve()
            .then(() => {
                assert.lengthOf(writeEvents, 0);
                // unknown methods:
                readStream.write({jsonrpc: '2.0', method: 'rpc.foo', id: 0});
                readStream.write({jsonrpc: '2.0', method: 'unknownMethod', id: 1});
                readStream.write({jsonrpc: '2.0', method: {}, id: 2});
                readStream.write({jsonrpc: '2.0', id: 3});

                // invalid version
                readStream.write({jsonrpc: '1.123', method: 'subtract', params: [42, 23], id: 4});
                readStream.write({method: 'subtract', params: [42, 23], id: 5});

                // invalid id
                readStream.write({jsonrpc: '2.0', method: 'subtract', params: [42, 23], id: {}});

                // invalid params
                readStream.write({jsonrpc: '2.0', method: 'subtract', params: 'foo', id: 7});
                readStream.write({jsonrpc: '2.0', method: 'subtract', params: 123, id: 8});

                return writeWait.wait(9);
            })
            .then(() => {
                assert.isFalse(calledReservedMethod);
                assert.lengthOf(writeEvents, 9);
                assert.lengthOf(errorEvents, 0);
                assert.lengthOf(protocolErrorEvents, 7);

                const assertProtocolError = (writeIndex, protocolErrorIndex, id, code, message) => {
                    assert.deepEqual(writeEvents[writeIndex], {
                        jsonrpc: '2.0',
                        error: {code, message},
                        id,
                    });

                    if (protocolErrorIndex >= 0) {
                        assert.instanceOf(protocolErrorEvents[protocolErrorIndex], RPCRequestError);
                        assert.strictEqual(protocolErrorEvents[protocolErrorIndex].name, 'RPCRequestError');
                        assert.strictEqual(protocolErrorEvents[protocolErrorIndex].code, code);
                        assert.strictEqual(protocolErrorEvents[protocolErrorIndex].message, message);
                    }
                };

                // unknown methods (not emitted as a "protocolError"):
                assertProtocolError(0, -1,    0, -32601, 'Method not found');
                assertProtocolError(1, -1,    1, -32601, 'Method not found');

                assertProtocolError(2,  0,    2, -32601, 'Method not found: "method" attribute must be a string');
                assertProtocolError(3,  1, null, -32600, 'Unable to determine if the message was a request or response object (one of' +
                    ' the "method", "result" or "error" properties must be present)');
                assertProtocolError(4,  2,    4, -32600, 'Invalid Request: given "jsonrpc" version is not supported');
                assertProtocolError(5,  3,    5, -32600, 'Invalid Request: "jsonrpc" attribute is missing (JSON-RPC version 1 is not' +
                    ' supported)');
                assertProtocolError(6,  4, null, -32600, 'Invalid Request: "id" must be a number or a string');
                assertProtocolError(7,  5,    7, -32600, 'Invalid Request: "params" must be an array or object');
                assertProtocolError(8,  6,    8, -32600, 'Invalid Request: "params" must be an array or object');
            });
        }));

        it('should call synchronous RPC methods', () => {
            readStream.pipe(rpc);
            rpc.pipe(writeStream);

            return Promise.resolve()
            .then(() => {
                assert.lengthOf(writeEvents, 0);

                // successful calls:
                readStream.write({jsonrpc: '2.0', method: 'subtract', params: [42, 23], id: 0});
                readStream.write({jsonrpc: '2.0', method: 'subtract', params: [100, 10], id: 1});
                readStream.write({jsonrpc: '2.0', method: 'π', params: [], id: 2});
                readStream.write({jsonrpc: '2.0', method: 'π', id: 3});
                readStream.write({jsonrpc: '2.0', method: 'divideNamed', params: {dividend: 100, divisor: 5}, id: 4});
                readStream.write({jsonrpc: '2.0', method: 'undef', params: [], id: 5}); // undefined should be converted to null

                return writeWait.wait(6);
            })
            .then(() => {
                assert.lengthOf(writeEvents, 6);
                assert.lengthOf(errorEvents, 0);
                assert.lengthOf(protocolErrorEvents, 0);

                // successful calls:
                assert.deepEqual(writeEvents[0], {jsonrpc: '2.0', result: 19, id: 0});
                assert.deepEqual(writeEvents[1], {jsonrpc: '2.0', result: 90, id: 1});
                assert.deepEqual(writeEvents[2], {jsonrpc: '2.0', result: 3.1, id: 2});
                assert.deepEqual(writeEvents[3], {jsonrpc: '2.0', result: 3.1, id: 3});
                assert.deepEqual(writeEvents[4], {jsonrpc: '2.0', result: {quotient: 20}, id: 4});
                assert.deepEqual(writeEvents[5], {jsonrpc: '2.0', result: null, id: 5});
            });
        });

        it('should not interpret the contents of the "id" property', () => {
            readStream.pipe(rpc);
            rpc.pipe(writeStream);

            return Promise.resolve()
            .then(() => {
                assert.lengthOf(writeEvents, 0);
                assert.lengthOf(errorEvents, 0);
                assert.lengthOf(protocolErrorEvents, 0);

                // successful calls:
                readStream.write({jsonrpc: '2.0', method: 'subtract', params: [42, 23], id: 100});
                readStream.write({jsonrpc: '2.0', method: 'subtract', params: [53, 10], id: -50});
                readStream.write({jsonrpc: '2.0', method: 'subtract', params: [35, 61], id: 0});
                readStream.write({jsonrpc: '2.0', method: 'subtract', params: [92, 34], id: 'string id'});
                readStream.write({jsonrpc: '2.0', method: 'subtract', params: [63, 60], id: ''});
                readStream.write({jsonrpc: '2.0', method: 'subtract', params: [2, 1], id: -50}); // repeated id

                return writeWait.wait(6);
            })
            .then(() => {
                assert.lengthOf(writeEvents, 6);
                assert.lengthOf(errorEvents, 0);
                assert.lengthOf(protocolErrorEvents, 0);

                // successful calls:
                assert.deepEqual(writeEvents[0], {jsonrpc: '2.0', result: 19, id: 100});
                assert.deepEqual(writeEvents[1], {jsonrpc: '2.0', result: 43, id: -50});
                assert.deepEqual(writeEvents[2], {jsonrpc: '2.0', result: -26, id: 0});
                assert.deepEqual(writeEvents[3], {jsonrpc: '2.0', result: 58, id: 'string id'});
                assert.deepEqual(writeEvents[4], {jsonrpc: '2.0', result: 3, id: ''});
                assert.deepEqual(writeEvents[5], {jsonrpc: '2.0', result: 1, id: -50});
            });
        });

        it('should reply with an error if a method throws', () => {
            readStream.pipe(rpc);
            rpc.pipe(writeStream);

            return Promise.resolve()
            .then(() => {
                readStream.write({jsonrpc: '2.0', method: 'throwError', id: 0});
                readStream.write({jsonrpc: '2.0', method: 'throwError', params: {code: 100}, id: 1});
                readStream.write({jsonrpc: '2.0', method: 'throwError', params: {data: 'foo'}, id: 2});
                readStream.write({jsonrpc: '2.0', method: 'throwError', params: {message: 123}, id: 3});
                readStream.write({jsonrpc: '2.0', method: 'throwError', params: {code: -32000}, id: 4}); // json-rpc predefined code
                readStream.write({jsonrpc: '2.0', method: 'throwError', params: {code: -32768}, id: 5}); // json-rpc predefined code

                return writeWait.wait(6);
            })
            .then(() => {
                rpc.sendErrorStack = true;
                readStream.write({
                    jsonrpc: '2.0',
                    method: 'throwError',
                    params: {
                        fileName: '/var/example.js',
                        lineNumber: 16,
                        columnNumber: 50,
                        stack: 'b@/var/example.js:16\na@/var/example.js:19',
                        other: 'foo', // should not be included
                    },
                    id: 6,
                });

                readStream.write({
                    jsonrpc: '2.0',
                    method: 'throwError',
                    params: {
                        fileName: '/var/example.js',
                        lineNumber: 16,
                        columnNumber: 50,
                        stack: 'b@/var/example.js:16\na@/var/example.js:19',
                        data: {foo: 'bar'}, // sendErrorStack should not affect existing data properties
                    },
                    id: 7,
                });

                return writeWait.wait(2);
            })
            .then(() => {
                assert.lengthOf(writeEvents, 8);
                assert.lengthOf(errorEvents, 0);
                assert.lengthOf(protocolErrorEvents, 0);

                assert.deepEqual(writeEvents[0], {
                    jsonrpc: '2.0',
                    error: {code: 0, message: 'A simple error'},
                    id: 0,
                });

                assert.deepEqual(writeEvents[1], {
                    jsonrpc: '2.0',
                    error: {code: 100, message: 'A simple error'},
                    id: 1,
                });

                assert.deepEqual(writeEvents[2], {
                    jsonrpc: '2.0',
                    error: {code: 0, message: 'A simple error', data: 'foo'},
                    id: 2,
                });

                assert.deepEqual(writeEvents[3], {
                    jsonrpc: '2.0',
                    error: {code: 0, message: '123'},
                    id: 3,
                });

                assert.deepEqual(writeEvents[4], {
                    jsonrpc: '2.0',
                    error: {code: -32000, message: 'A simple error'},
                    id: 4,
                });

                assert.deepEqual(writeEvents[5], {
                    jsonrpc: '2.0',
                    error: {code: -32768, message: 'A simple error'},
                    id: 5,
                });

                assert.deepEqual(writeEvents[6], {
                    jsonrpc: '2.0',
                    error: {
                        code: 0,
                        message: 'A simple error',
                        data: {
                            isJSError: true,
                            name: 'Error',
                            fileName: '/var/example.js',
                            lineNumber: 16,
                            columnNumber: 50,
                            stack: 'b@/var/example.js:16\na@/var/example.js:19',
                        },
                    },
                    id: 6,
                });

                assert.deepEqual(writeEvents[7], {
                    jsonrpc: '2.0',
                    error: {
                        code: 0,
                        message: 'A simple error',
                        data: {foo: 'bar'},
                    },
                    id: 7,
                });
            });
        });

        it('should call asynchronous RPC methods which return a promise', () => Promise.resolve().then(() => {
            readStream.pipe(rpc);
            rpc.pipe(writeStream);

            return Promise.resolve()
            .then(() => {
                assert.lengthOf(writeEvents, 0);

                // successful calls:
                readStream.write({jsonrpc: '2.0', method: 'subtractAsync', params: [42, 23], id: 0});
                readStream.write({jsonrpc: '2.0', method: 'subtractAsync', params: [100, 10], id: 1});

                // rejected:
                readStream.write({jsonrpc: '2.0', method: 'rejectAsync', params: {}, id: 2});

                return writeWait.wait(3);
            })
            .then(() => {
                assert.lengthOf(writeEvents, 3);
                assert.lengthOf(errorEvents, 0);
                assert.lengthOf(protocolErrorEvents, 0);

                // successful calls:
                assert.deepEqual(writeEvents[0], {jsonrpc: '2.0', result: 19, id: 0});
                assert.deepEqual(writeEvents[1], {jsonrpc: '2.0', result: 90, id: 1});

                assert.deepEqual(writeEvents[2], {
                    jsonrpc: '2.0',
                    error: {
                        code: 0,
                        message: 'A simple error',
                    },
                    id: 2,
                });
            });
        }));

        it('should queue response objects if no write stream has been set', () => {
            readStream.pipe(rpc);
            rpc.pipe(writeStream);

            return Promise.resolve()
            .then(() => {
                assert.lengthOf(writeEvents, 0);

                readStream.write({jsonrpc: '2.0', method: 'subtract', params: [42, 23], id: 0});

                return writeWait.wait(1);
            }).then(() => {
                rpc.unpipe(writeStream);

                readStream.write({jsonrpc: '2.0', method: 'subtract', params: [100, 10], id: 1});
                readStream.write({jsonrpc: '2.0', method: 'throwError', params: {}, id: 2});

                return delay(5);
            }).then(() => {
                assert.lengthOf(writeEvents, 1);
                rpc.pipe(writeStream);

                return writeWait.wait(2);
            })
            .then(() => {
                assert.lengthOf(writeEvents, 3);
                assert.lengthOf(errorEvents, 0);
                assert.lengthOf(protocolErrorEvents, 0);

                // successful calls:
                assert.deepEqual(writeEvents[0], {jsonrpc: '2.0', result: 19, id: 0});
                assert.deepEqual(writeEvents[1], {jsonrpc: '2.0', result: 90, id: 1});

                assert.deepEqual(writeEvents[2], {
                    jsonrpc: '2.0',
                    error: {
                        code: 0,
                        message: 'A simple error',
                    },
                    id: 2,
                });
            });
        });

        it('should be able to respond to requests out of order', () => {
            readStream.pipe(rpc);
            rpc.pipe(writeStream);

            const foo = manualPromise();
            const bar = manualPromise();
            const baz = manualPromise();
            const quux = manualPromise();

            rpc.method('foo', () => foo.promise);
            rpc.method('bar', () => bar.promise);
            rpc.method('baz', () => baz.promise);
            rpc.method('quux', () => quux.promise);

            return Promise.all([
                streamWrite(readStream, {jsonrpc: '2.0', method: 'foo', params: [], id: 0}),
                streamWrite(readStream, {jsonrpc: '2.0', method: 'bar', params: [], id: 1}),
                streamWrite(readStream, {jsonrpc: '2.0', method: 'baz', params: [], id: 2}),
                streamWrite(readStream, {jsonrpc: '2.0', method: 'quux', params: [], id: 3}),
                delay(5),
            ])
            .then(() => {
                assert.lengthOf(writeEvents, 0);
                assert.lengthOf(errorEvents, 0);
                assert.lengthOf(protocolErrorEvents, 0);

                assert.strictEqual(rpc.serverPending, 4);

                bar.resolve('bar');

                return writeWait.wait(1);
            })
            .then(() => {
                assert.lengthOf(writeEvents, 1);
                assert.lengthOf(errorEvents, 0);
                assert.lengthOf(protocolErrorEvents, 0);
                assert.strictEqual(rpc.serverPending, 3);

                assert.deepEqual(writeEvents[0], {
                    jsonrpc: '2.0',
                    result: 'bar',
                    id: 1,
                });

                foo.resolve('foo');

                return writeWait.wait(1);
            })
            .then(() => {
                assert.lengthOf(writeEvents, 2);
                assert.lengthOf(errorEvents, 0);
                assert.lengthOf(protocolErrorEvents, 0);
                assert.strictEqual(rpc.serverPending, 2);

                assert.deepEqual(writeEvents[1], {
                    jsonrpc: '2.0',
                    result: 'foo',
                    id: 0,
                });

                quux.resolve('quux');

                return writeWait.wait(1);
            })
            .then(() => {
                assert.lengthOf(writeEvents, 3);
                assert.lengthOf(errorEvents, 0);
                assert.lengthOf(protocolErrorEvents, 0);
                assert.strictEqual(rpc.serverPending, 1);

                assert.deepEqual(writeEvents[2], {
                    jsonrpc: '2.0',
                    result: 'quux',
                    id: 3,
                });

                baz.resolve('baz');

                return writeWait.wait(1);
            })
            .then(() => {
                assert.lengthOf(writeEvents, 4);
                assert.lengthOf(errorEvents, 0);
                assert.lengthOf(protocolErrorEvents, 0);
                assert.strictEqual(rpc.serverPending, 0);

                assert.deepEqual(writeEvents[3], {
                    jsonrpc: '2.0',
                    result: 'baz',
                    id: 2,
                });
            });
        });

        it('should call RPC notifications', () => Promise.resolve().then(() => {
            readStream.pipe(rpc);
            rpc.pipe(writeStream);

            const foos = [];
            const foosWait = new Wait();

            rpc.notification('foo', (a, b) => {
                foos.push([a, b]);
                foosWait.advance();
            });

            return Promise.resolve()
            .then(() => {
                assert.lengthOf(writeEvents, 0);

                // successful calls:
                readStream.write({jsonrpc: '2.0', method: 'foo', params: [42, 23]});
                readStream.write({jsonrpc: '2.0', method: 'foo', params: []});
                readStream.write({jsonrpc: '2.0', method: 'foo', params: {bar: 123, baz: 456}});

                return foosWait.wait(3);
            })
            .then(() => {
                assert.lengthOf(writeEvents, 0);
                assert.lengthOf(errorEvents, 0);
                assert.lengthOf(protocolErrorEvents, 0);

                assert.deepEqual(foos, [
                    [42, 23],
                    [undefined, undefined],
                    [{bar: 123, baz: 456}, undefined],
                ]);
            });
        }));

        it('should end the readable stream if the writable stream has finished (after sending all pending responses)', () => {
            readStream.pipe(rpc);
            rpc.pipe(writeStream);

            const foo = manualPromise();
            const bar = manualPromise();

            rpc.method('foo', () => foo.promise);
            rpc.method('bar', () => bar.promise);

            assert.isTrue(rpc.endOnFinish, 'endOnFinish should be enabled by default');

            let end = false;

            rpc.on('end', () => {
                end = true;
            });

            return Promise.all([
                streamWrite(readStream, {jsonrpc: '2.0', method: 'foo', params: [], id: 0}),
                streamWrite(readStream, {jsonrpc: '2.0', method: 'bar', params: [], id: 1}),
                delay(5),
            ])
            .then(() => {
                assert(!end);
                assert.lengthOf(writeEvents, 0);
                assert.lengthOf(errorEvents, 0);
                assert.lengthOf(protocolErrorEvents, 0);

                // emits 'finish' on the writable stream, the readable stream should not yet end because we have response
                // objects pending
                rpc.end();

                assert(!end);

                return delay(5);
            }).then(() => {
                assert(!end);
                bar.resolve('bar');

                return writeWait.wait(1);
            })
            .then(() => {
                assert.lengthOf(writeEvents, 1);
                assert.lengthOf(errorEvents, 0);
                assert.lengthOf(protocolErrorEvents, 0);
                assert(!end);

                assert.deepEqual(writeEvents[0], {
                    jsonrpc: '2.0',
                    result: 'bar',
                    id: 1,
                });

                foo.resolve('foo');

                return writeWait.wait(2);
            })
            .then(() => {
                assert.lengthOf(writeEvents, 3);
                assert.lengthOf(errorEvents, 0);
                assert.lengthOf(protocolErrorEvents, 0);

                assert.deepEqual(writeEvents[1], {
                    jsonrpc: '2.0',
                    result: 'foo',
                    id: 0,
                });

                assert.strictEqual(writeEvents[2], FINISH);
                assert(end);
            });
        });

        it('should not end the readable stream if the writable stream has finished if endOnFinish = false', () => {
            readStream.pipe(rpc);
            rpc.pipe(writeStream);

            const foo = manualPromise();
            const bar = manualPromise();

            rpc.method('foo', () => foo.promise);
            rpc.method('bar', () => bar.promise);

            rpc.endOnFinish = false;

            let end = false;

            rpc.on('end', () => {
                end = true;
            });

            return Promise.all([
                streamWrite(readStream, {jsonrpc: '2.0', method: 'foo', params: [], id: 0}),
                delay(5),
            ])
            .then(() => {
                assert(!end);
                assert.lengthOf(writeEvents, 0);
                assert.lengthOf(errorEvents, 0);
                assert.lengthOf(protocolErrorEvents, 0);

                rpc.end(); // finish the writable stream

                assert(!end);

                return delay(5);
            }).then(() => {
                assert(!end);
                foo.resolve('foo');

                return writeWait.wait(1);
            })
            .then(() => {
                assert.lengthOf(writeEvents, 1);
                assert.lengthOf(errorEvents, 0);
                assert.lengthOf(protocolErrorEvents, 0);
                assert(!end);

                assert.deepEqual(writeEvents[0], {
                    jsonrpc: '2.0',
                    result: 'foo',
                    id: 0,
                });

                return delay(5);
            })
            .then(() => {
                assert.lengthOf(writeEvents, 1);
                assert.lengthOf(errorEvents, 0);
                assert.lengthOf(protocolErrorEvents, 0);
                assert(!end);
            });
        });
    });

    describe('as a client', () => {
        it('should properly resolve or reject rpc calls', () => {
            readStream.pipe(rpc);
            rpc.pipe(writeStream);

            const fates = new PromiseFateTracker();

            assert.strictEqual(rpc.clientPending, 0);
            fates.track(0, rpc.call('foo'));
            assert.strictEqual(rpc.clientPending, 1);
            fates.track(1, rpc.call('foo', 10));
            const foo = rpc.bindCall('foo');
            fates.track(2, foo(10, 'bar'));
            fates.track(3, foo({bar: 10, arrayz: [50, 'bla']}));
            fates.track(4, rpc.call('reject me'));
            fates.track(5, rpc.call('reject me'));
            fates.track(6, rpc.call('reject me'));
            fates.track(7, rpc.call('reject me'));
            assert.strictEqual(rpc.clientPending, 8);

            return writeWait.wait(8).then(() => {
                fates.assertPending(0);
                fates.assertPending(1);
                fates.assertPending(2);
                fates.assertPending(3);
                fates.assertPending(4);
                fates.assertPending(5);
                fates.assertPending(6);
                fates.assertPending(7);
                assert.strictEqual(rpc.clientPending, 8);

                assert.lengthOf(writeEvents, 8);

                assert.deepEqual(writeEvents[0], {
                    jsonrpc: '2.0',
                    method: 'foo',
                    params: [],
                    id: 0,
                });

                assert.deepEqual(writeEvents[1], {
                    jsonrpc: '2.0',
                    method: 'foo',
                    params: [10],
                    id: 1,
                });

                assert.deepEqual(writeEvents[2], {
                    jsonrpc: '2.0',
                    method: 'foo',
                    params: [10, 'bar'],
                    id: 2,
                });

                assert.deepEqual(writeEvents[3], {
                    jsonrpc: '2.0',
                    method: 'foo',
                    params: [{bar: 10, arrayz: [50, 'bla']}],
                    id: 3,
                });

                for (let id = 4; id <= 7; ++id) {
                    assert.deepEqual(writeEvents[id], {
                        jsonrpc: '2.0',
                        method: 'reject me',
                        params: [],
                        id: id,
                    });
                }

                return Promise.all([
                    streamWrite(readStream, {jsonrpc: '2.0', result: 19, id: 0}),
                    streamWrite(readStream, {jsonrpc: '2.0', result: 'foo bar', id: 1}),
                    streamWrite(readStream, {jsonrpc: '2.0', result: {foo: [{bar: 123}]}, id: 2}),
                    streamWrite(readStream, {jsonrpc: '2.0', result: null, id: 3}),

                    streamWrite(readStream, {jsonrpc: '2.0', error: {code: 123, message: 'foo', data: 'abc'}, id: 4}),
                    streamWrite(readStream, {jsonrpc: '2.0', error: {code: 0, data: {foo: 'abc'}}, id: 5}),
                    streamWrite(readStream, {jsonrpc: '2.0', error: {code: -32603}, id: 6}),
                    streamWrite(readStream, {jsonrpc: '2.0', error: {}, id: 7}),
                ]);
            })
            .then(() => fates.waitForAllSettled())
            .then(() => {
                assert.lengthOf(errorEvents, 0);
                assert.lengthOf(protocolErrorEvents, 0);

                fates.assertResolved(0, 19);
                fates.assertResolved(1, 'foo bar');
                fates.assertResolved(2, {foo: [{bar: 123}]});
                fates.assertResolved(3, null);

                fates.assertRejected(4, RPCRequestError, /^foo$/);
                assert.strictEqual(fates.getFate(4).reject.code, 123);
                assert.strictEqual(fates.getFate(4).reject.data, 'abc');

                fates.assertRejected(5, RPCRequestError, /^$/);
                assert.strictEqual(fates.getFate(5).reject.code, 0);
                assert.deepEqual(fates.getFate(5).reject.data, {foo: 'abc'});

                fates.assertRejected(6, RPCRequestError, /^Internal error$/); // default error message for -32603
                assert.strictEqual(fates.getFate(6).reject.code, -32603);
                assert.isUndefined(fates.getFate(6).reject.data);

                fates.assertRejected(7, RPCRequestError, /^$/);
                assert.strictEqual(fates.getFate(7).reject.code, 0);
                assert.isUndefined(fates.getFate(7).reject.data);

                assert.strictEqual(rpc.clientPending, 0);
            });
        });

        it('should interpret remote error stacks if receiveErrorStack is enabled', () => {
            readStream.pipe(rpc);
            rpc.pipe(writeStream);

            const fates = new PromiseFateTracker();
            // obtained by executing `Error('Uh o!').stack` in the node.js REPL
            const testStack = 'Error: Uh o!\n    at Error (native)\n    at repl:1:1\n    at sigintHandlersWrap (vm.js:22:35)\n    at' +
                ' sigintHandlersWrap (vm.js:96:12)\n    at ContextifyScript.Script.runInThisContext (vm.js:21:12)\n    at' +
                ' REPLServer.defaultEval (repl.js:313:29)\n    at bound (domain.js:280:14)\n    at REPLServer.runBound [as eval]' +
                ' (domain.js:293:12)\n    at REPLServer.<anonymous> (repl.js:503:10)\n    at emitOne (events.js:101:20)';

            assert.isFalse(rpc.receiveErrorStack, 'Should be off by default'); // (e.g. our peer can not be trusted)
            rpc.receiveErrorStack = true;
            fates.track(0, rpc.call('reject me'));
            fates.track(1, rpc.call('reject me'));
            fates.track(2, rpc.call('reject me'));
            fates.track(3, rpc.call('reject me'));

            return writeWait.wait(4)
            .then(() => {
                fates.assertPending(0);
                fates.assertPending(1);
                fates.assertPending(2);
                fates.assertPending(3);
            })
            .then(() => Promise.all([
                streamWrite(readStream, {
                    jsonrpc: '2.0',
                    error: {
                        code: 123,
                        message: 'foo',
                        data: {
                            isJSError: true,
                            name: 'FooError',
                            stack: testStack,
                            fileName: 'foo.js',
                            lineNumber: 123,
                            columnNumber: 10,
                        },
                    },
                    id: 0,
                }),
                streamWrite(readStream, {
                    jsonrpc: '2.0',
                    error: {
                        code: 123,
                        message: 'foo',
                        data: {
                            isJSError: true,
                        },
                    },
                    id: 1,
                }),
                streamWrite(readStream, {
                    jsonrpc: '2.0',
                    error: {
                        code: 123,
                        message: 'foo',
                        data: {
                            isJSError: false,
                            name: 'FooError',
                            stack: testStack,
                            fileName: 'foo.js',
                            lineNumber: 123,
                            columnNumber: 10,
                        },
                    },
                    id: 2,
                }),
                streamWrite(readStream, {
                    jsonrpc: '2.0',
                    error: {
                        code: 123,
                        message: 'foo',
                    },
                    id: 3,
                }),
            ]))
            .then(() => fates.waitForAllSettled())
            .then(() => {
                fates.assertRejected(0);
                fates.assertRejected(1);
                fates.assertRejected(2);
                fates.assertRejected(3);

                const error0 = fates.getFate(0).reject;
                const error1 = fates.getFate(1).reject;
                const error2 = fates.getFate(2).reject;
                const error3 = fates.getFate(3).reject;

                assert.strictEqual(error0.name, 'RPCRequestError<FooError>');
                assert.strictEqual(error0.message, 'foo');
                assert.strictEqual(error0.fileName, 'foo.js');
                assert.strictEqual(error0.lineNumber, 123);
                assert.strictEqual(error0.columnNumber, 10);
                assert.isString(error0.localStack);
                assert.isAtLeast(error0.localStack.length, 50);
                assert.strictEqual(error0.remoteStack, testStack);
                assert.strictEqual(error0.stack, error0.localStack + '\n' + 'Caused by Remote ' + testStack);

                assert.strictEqual(error1.name, 'RPCRequestError<undefined>');
                assert.strictEqual(error1.message, 'foo');
                assert.strictEqual(error1.fileName, 'undefined');
                assert(Number.isNaN(error1.lineNumber));
                assert(Number.isNaN(error1.columnNumber));
                assert.isString(error1.localStack);
                assert.isAtLeast(error1.localStack.length, 50);
                assert.strictEqual(error1.remoteStack, 'undefined');
                assert.strictEqual(error1.stack, error1.localStack + '\n' + 'Caused by Remote undefined');

                assert.strictEqual(error2.name, 'RPCRequestError');
                assert.strictEqual(error2.message, 'foo');
                assert.notEqual(error2.fileName, 'foo.js');
                assert.notEqual(error2.lineNumber, 123);
                assert.notEqual(error2.columnNumber, 10);
                assert.isUndefined(error2.localStack);
                assert.isUndefined(error2.remoteStack);
                assert.notMatch(error2.stack, /cause|remote/i);

                assert.strictEqual(error3.name, 'RPCRequestError');
                assert.strictEqual(error3.message, 'foo');
                assert.notEqual(error3.fileName, 'foo.js');
                assert.notEqual(error3.lineNumber, 123);
                assert.notEqual(error3.columnNumber, 10);
                assert.isUndefined(error3.localStack);
                assert.isUndefined(error3.remoteStack);
                assert.notMatch(error3.stack, /cause|remote/i);
                error3.parseDataAsRemoteStack();
                assert.strictEqual(error3.name, 'RPCRequestError<undefined>');
                assert.strictEqual(error3.message, 'foo');
                assert.strictEqual(error3.fileName, 'undefined');
                assert(Number.isNaN(error3.lineNumber));
                assert(Number.isNaN(error3.columnNumber));
                assert.isString(error3.localStack);
                assert.isAtLeast(error3.localStack.length, 50);
                assert.strictEqual(error3.remoteStack, 'undefined');
                assert.strictEqual(error3.stack, error3.localStack + '\n' + 'Caused by Remote undefined');


                rpc.receiveErrorStack = false;
                fates.track(4, rpc.call('reject me'));

                return writeWait.wait(1);
            })
            .then(() => fates.assertPending(4))
            .then(() => streamWrite(readStream, {
                jsonrpc: '2.0',
                error: {
                    code: 123,
                    message: 'foo',
                    data: {
                        isJSError: true,
                        name: 'FooError',
                        stack: testStack,
                        fileName: 'foo.js',
                        lineNumber: 123,
                        columnNumber: 10,
                    },
                },
                id: 4,
            }))
            .then(() => fates.waitForAllSettled())
            .then(() => {
                fates.assertRejected(4);
                const error4 = fates.getFate(4).reject;

                assert.strictEqual(error4.name, 'RPCRequestError');
                assert.strictEqual(error4.message, 'foo');
                assert.notEqual(error4.fileName, 'foo.js');
                assert.notEqual(error4.lineNumber, 123);
                assert.notEqual(error4.columnNumber, 10);
                assert.isUndefined(error4.localStack);
                assert.isUndefined(error4.remoteStack);
                assert.notMatch(error4.stack, /cause|remote/i);
            })
            ;
        });

        it('should report invalid response objects', () => {
            readStream.pipe(rpc);
            rpc.pipe(writeStream);

            // Handle this as a response object explicitly, otherwise we report the error as an invalid request
            rpc.handleResponseObject({jsonrpc: '2.0', id: 0})
                .then(
                    () => assert(false),
                    error => {
                        assert.instanceOf(error, RPCResponseError);
                        assert.strictEqual(error.name, 'RPCResponseError');
                        assert.strictEqual(error.message, 'Invalid Response: Must have a "error" or an "result" property');
                    }
                );

            return Promise.all([
                streamWrite(readStream, {result: 19, id: 0}), // missing jsonrpc
                streamWrite(readStream, {jsonrpc: '1.5', result: 19, id: 0}), // wrong version
                streamWrite(readStream, {jsonrpc: '2.0', result: 19, id: {}}), // id must be number/string
                streamWrite(readStream, {jsonrpc: '2.0', result: 123}), // missing id
                streamWrite(readStream, {jsonrpc: '2.0', result: 123, error: {}, id: 0}), // result and error are mutually exclusive
                streamWrite(readStream, {jsonrpc: '2.0', result: 123, id: 0}), // valid, however we never sent a request with this id
                protocolErrorWait.wait(6),
            ])
            .then(() => {
                assert.lengthOf(errorEvents, 0);
                assert.lengthOf(protocolErrorEvents, 6);

                // eslint-disable-next-line prefer-const
                for (let error of protocolErrorEvents) {
                    assert.instanceOf(error, RPCResponseError);
                    assert.strictEqual(error.name, 'RPCResponseError');
                }

                assert.strictEqual(
                    protocolErrorEvents[0].message,
                    'Invalid Response: "jsonrpc" property must be "2.0"'
                );
                assert.strictEqual(
                    protocolErrorEvents[1].message,
                    'Invalid Response: "jsonrpc" property must be "2.0"'
                );
                assert.strictEqual(
                    protocolErrorEvents[2].message,
                    'Invalid Response: "id" property must be a number or string'
                );
                assert.strictEqual(
                    protocolErrorEvents[3].message,
                    'Invalid Response: "id" property must be a number or string'
                );
                assert.strictEqual(
                    protocolErrorEvents[4].message,
                    'Invalid Response: The "error" and "result" properties are both present'
                );
                assert.strictEqual(
                    protocolErrorEvents[5].message,
                    'Invalid Response: Unknown id'
                );
            });
        });

        it('should properly cancel calls after a timeout', () => {
            readStream.pipe(rpc);
            rpc.pipe(writeStream);

            const fates = new PromiseFateTracker();

            assert.strictEqual(rpc.defaultTimeout, 0); // no timeout by default
            fates.track(0, rpc.call({name: 'foo', timeout: 5}, 'bar'));
            rpc.defaultTimeout = 9;
            fates.track(1, rpc.call({name: 'baz'}, 'quux'));
            rpc.defaultTimeout = 8; // rpc.call does things asynchronous, however it should read the defaultTimeout right away

            return fates.waitForAllSettled() // wait until they have all timed out
            .then(() => {
                assert.lengthOf(errorEvents, 0);
                assert.lengthOf(protocolErrorEvents, 0);
                assert.lengthOf(writeEvents, 2);

                assert.deepEqual(writeEvents[0], {
                    jsonrpc: '2.0',
                    method: 'foo',
                    params: ['bar'],
                    id: 0,
                });

                assert.deepEqual(writeEvents[1], {
                    jsonrpc: '2.0',
                    method: 'baz',
                    params: ['quux'],
                    id: 1,
                });

                fates.assertRejected(0, RPCRequestError, /^Remote Call timed out after 5ms$/i);
                fates.assertRejected(1, RPCRequestError, /^Remote Call timed out after 9ms$/i);
                assert.strictEqual(fates.getFate(0).reject.code, -32000);
                assert.strictEqual(fates.getFate(1).reject.code, -32000);
            });
        });

        it('should properly queue rpc calls if no stream has been set', () => {
            readStream.pipe(rpc);
            rpc.pipe(writeStream);

            const fates = new PromiseFateTracker();

            return Promise.resolve().then(() => {
                fates.track(0, rpc.call('foo'));
                assert.strictEqual(rpc.clientPending, 1);

                return writeWait.wait(1);
            })
            .then(() => {
                rpc.unpipe(writeStream);
                fates.track(1, rpc.call('foo', 10)); // should be queued
                fates.track(2, rpc.call('foo', 123)); // should be queued
                assert.strictEqual(rpc.clientPending, 3);

                fates.assertPending(0);
                fates.assertPending(1);
                fates.assertPending(2);

                return delay(5);
            })
            .then(() => {
                assert.lengthOf(writeEvents, 1);

                assert.deepEqual(writeEvents[0], {
                    jsonrpc: '2.0',
                    method: 'foo',
                    params: [],
                    id: 0,
                });

                rpc.pipe(writeStream); // should start to drain outgoing calls now

                return writeWait.wait(2);
            })
            .then(() => {
                assert.deepEqual(writeEvents[1], {
                    jsonrpc: '2.0',
                    method: 'foo',
                    params: [10],
                    id: 1,
                });

                assert.deepEqual(writeEvents[2], {
                    jsonrpc: '2.0',
                    method: 'foo',
                    params: [123],
                    id: 2,
                });

                assert.strictEqual(rpc.clientPending, 3);

                return Promise.all([
                    streamWrite(readStream, {jsonrpc: '2.0', result: 19, id: 0}),
                    streamWrite(readStream, {jsonrpc: '2.0', result: 'foo bar', id: 1}),
                    streamWrite(readStream, {jsonrpc: '2.0', result: 'baz', id: 2}),
                ]);
            })
            .then(() => fates.waitForAllSettled())
            .then(() => {
                assert.lengthOf(errorEvents, 0);
                assert.lengthOf(protocolErrorEvents, 0);

                fates.assertResolved(0, 19);
                fates.assertResolved(1, 'foo bar');
                fates.assertResolved(2, 'baz');
                assert.strictEqual(rpc.clientPending, 0);
            });
        });

        it('should properly send notifications', () => {
            readStream.pipe(rpc);
            rpc.pipe(writeStream);

            const p = [];
            assert.strictEqual(rpc.clientPending, 0);
            p.push(rpc.notify('foo'));
            p.push(rpc.notify('foo', 10));
            const foo = rpc.bindNotify('foo');
            p.push(foo(10, 'bar'));
            p.push(foo({bar: 10, arrayz: [50, 'bla']}));
            assert.strictEqual(rpc.clientPending, 0);

            return writeWait.wait(4)
            .then(() => Promise.all(p))
            .then(() => {
                assert.lengthOf(writeEvents, 4);

                assert.deepEqual(writeEvents[0], {
                    jsonrpc: '2.0',
                    method: 'foo',
                    params: [],
                });

                assert.deepEqual(writeEvents[1], {
                    jsonrpc: '2.0',
                    method: 'foo',
                    params: [10],
                });

                assert.deepEqual(writeEvents[2], {
                    jsonrpc: '2.0',
                    method: 'foo',
                    params: [10, 'bar'],
                });

                assert.deepEqual(writeEvents[3], {
                    jsonrpc: '2.0',
                    method: 'foo',
                    params: [{bar: 10, arrayz: [50, 'bla']}],
                });
            });
        });

        it('should reject call() and notify() if the readable stream has already ended', () => {
            readStream.pipe(rpc);
            rpc.pipe(writeStream);
            rpc.finishOnEnd = false;

            let finish = false;

            rpc.on('finish', () => {
                finish = true;
            });

            const fates = new PromiseFateTracker();

            return new Promise(resolve => {
                rpc.on('end', resolve);
                rpc.push(null);
            })
            .then(() => {
                assert(!finish);

                fates.track(0, rpc.call('foo'));
                fates.track(1, rpc.notify('foo'));

                return fates.waitForAllSettled();
            })
            .then(() => {
                fates.assertRejected(0, Error, /Readable.*ended.*unable.*send/i);
                fates.assertRejected(1, Error, /Readable.*ended.*unable.*send/i);
            });
        });

        it('should reject call() but not notify() if the writable stream has finished', () => {
            readStream.pipe(rpc);
            rpc.pipe(writeStream);
            rpc.endOnFinish = false;

            let end = false;

            rpc.on('end', () => {
                end = true;
            });

            const fates = new PromiseFateTracker();

            return new Promise(resolve => {
                rpc.on('finish', resolve);
                rpc.end();
            })
            .then(() => {
                assert(!end);

                fates.track(0, rpc.call('foo'));
                fates.track(1, rpc.notify('foo'));

                return Promise.all([writeWait.wait(1), fates.waitForAllSettled()]);
            })
            .then(() => {
                fates.assertRejected(0, Error, /Writable.*finished.*unable.*receive/i);
                fates.assertResolved(1);

                assert.deepEqual(writeEvents[0], {
                    jsonrpc: '2.0',
                    method: 'foo',
                    params: [],
                });
            });
        });

        it('should finish the writable stream if the readable stream has ended (after resolving all pending calls)', () => {
            readStream.pipe(rpc);
            rpc.pipe(writeStream);

            assert.isTrue(rpc.finishOnEnd, 'finishOnEnd should be enabled by default');

            let finish = false;

            rpc.on('finish', () => {
                finish = true;
            });

            const fates = new PromiseFateTracker();

            fates.track(0, rpc.call('foo'));
            fates.track(1, rpc.call('reject me'));

            return writeWait.wait(2)
            .then(() => {
                rpc.push(null); // end the readable stream
                assert(!finish);

                return delay(5);
            })
            .then(() => {
                assert(!finish);
                readStream.write({jsonrpc: '2.0', result: 19, id: 0});

                return fates.waitForSettled(0).then(() => delay(5));
            })
            .then(() => {
                assert(!finish);
                readStream.write({jsonrpc: '2.0', error: {code: 123, message: 'foo', data: 'abc'}, id: 1});

                return fates.waitForSettled(1).then(() => delay(5));
            })
            .then(() => {
                assert(finish);
                fates.assertResolved(0);
                fates.assertRejected(1);
            });
        });

        it('should not finish the writable stream if the readable stream has ended if finishOnEnd=false', () => {
            readStream.pipe(rpc);
            rpc.pipe(writeStream);
            rpc.finishOnEnd = false;

            let finish = false;

            rpc.on('finish', () => {
                finish = true;
            });

            const fates = new PromiseFateTracker();

            fates.track(0, rpc.call('foo'));

            return writeWait.wait(1)
            .then(() => {
                rpc.push(null); // end the readable stream
                assert(!finish);

                return delay(5);
            })
            .then(() => {
                assert(!finish);
                readStream.write({jsonrpc: '2.0', result: 19, id: 0});

                return fates.waitForSettled(0).then(() => delay(5));
            })
            .then(() => {
                assert(!finish);
                fates.assertResolved(0);
            });
        });
    });
});

