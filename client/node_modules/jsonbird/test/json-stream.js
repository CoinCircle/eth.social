/* eslint prefer-rest-params: 'off' */
/* eslint max-nested-callbacks: 'off' */
'use strict';

const {describe, it, beforeEach} = require('mocha-sugar-free');
const {assert} = require('chai');
const through = require('through2');

const Wait = require('./Wait');
const JSONBird = require('../lib/JSONBird');

const END = Symbol('END');

describe('JSONBird handling string/buffer streams', () => {
    describe('as a server', () => {
        let rpc = null;
        let errorEvents = null;
        let errorWait = null;
        let writeEvents = null;
        let writeWait = null;
        let protocolErrorEvents = null;
        let protocolErrorWait = null;
        let readStream = null;
        let writeStream = null;

        beforeEach(() => {
            writeEvents = [];
            writeWait = new Wait();
            errorEvents = [];
            errorWait = new Wait();
            protocolErrorEvents = [];
            protocolErrorWait = new Wait();

            rpc = new JSONBird({
                sessionId: null,
                writableMode: 'json-stream',
                readableMode: 'object',
            });

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

            readStream = through();

            writeStream = through.obj(
                (data, encoding, callback) => {
                    // console.log('writeEvent', data);
                    writeEvents.push(data);
                    writeWait.advance();
                    callback();
                },
                () => writeEvents.push(END)
            );
        });

        it('should properly parse json strings', () => {
            readStream.pipe(rpc);
            rpc.pipe(writeStream);

            return Promise.resolve()
            .then(() => {
                rpc.method('いろはにほ', () => 123);
                rpc.method('foo', (a, b) => [a, b]);

                readStream.write(
                    '{"jsonrpc": "2.0", "method": "いろはにほ", "params": [42,23], "id":0}' +
                    '{"jsonrpc": "2.0", "method": "foo",       "params": [100, {"foo": "bar ¢ bar € bar 𐍈 bar"}],"id": 1}' +
                    '{"jsonrpc": "2.0", "method": "foo",      "params": ["Árvíztűrő tükörfúrógép"],"id": 2}' +
                    '{"jsonrpc": "2.0", "method": "foo",      "params": [], "id":3}\n\r\t     ' +
                    '{"jsonrpc": "2.0", "method": "foo",      "params": [], "id":4}\r\n'
                );

                return writeWait.wait(5);
            })
            .then(() => {
                assert.lengthOf(writeEvents, 5);
                assert.lengthOf(errorEvents, 0);
                assert.lengthOf(protocolErrorEvents, 0);

                assert.deepEqual(writeEvents[0], {jsonrpc: '2.0', result: 123, id: 0});
                assert.deepEqual(writeEvents[1], {jsonrpc: '2.0', result: [100, {foo: 'bar ¢ bar € bar 𐍈 bar'}], id: 1});
                assert.deepEqual(writeEvents[2], {jsonrpc: '2.0', result: ['Árvíztűrő tükörfúrógép', undefined], id: 2});
                assert.deepEqual(writeEvents[3], {jsonrpc: '2.0', result: [undefined, undefined], id: 3});
                assert.deepEqual(writeEvents[4], {jsonrpc: '2.0', result: [undefined, undefined], id: 4});
            });
        });

        it('should reply (once) about parsing errors', () => {
            readStream.pipe(rpc);
            rpc.pipe(writeStream);

            return Promise.resolve()
            .then(() => {
                readStream.write('{"foo": 123]}');

                return writeWait.wait(1);
            })
            .then(() => {
                assert.lengthOf(writeEvents, 1);
                assert.lengthOf(errorEvents, 0);
                assert.lengthOf(protocolErrorEvents, 1);

                assert.deepEqual(writeEvents[0], {
                    jsonrpc: '2.0',
                    error: {
                        code: -32700,
                        message: 'Error parsing your JSON string: Unexpected RIGHT_BRACKET(\"]\") in state COMMA',
                    },
                    id: null,
                });
            });
        });
    });

    describe('as a client', () => {
        let rpc = null;
        let errorEvents = null;
        let errorWait = null;
        let protocolErrorEvents = null;
        let protocolErrorWait = null;
        let readStream = null;
        let writeStream = null;
        let writeEndPromise = null;
        let writtenString = '';

        beforeEach(() => {
            errorEvents = [];
            errorWait = new Wait();
            protocolErrorEvents = [];
            protocolErrorWait = new Wait();
            writtenString = '';

            rpc = new JSONBird({
                sessionId: null,
                writableMode: 'object',
                readableMode: 'json-stream',
                endOfJSONWhitespace: '\n',
            });

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

            readStream = through.obj();

            writeEndPromise = new Promise(resolve => {
                writeStream = through(
                    (data, encoding, callback) => {
                        const stringData = data.toString('utf8');
                        // console.log('writtenString', stringData);
                        writtenString += stringData;
                        callback();
                    },
                    () => {
                        resolve(writtenString);
                    }
                );
            });
        });

        it('should write proper json strings', () => {
            readStream.pipe(rpc);
            rpc.pipe(writeStream);

            rpc.call('いろはにほ');
            rpc.call('foo', 10, 'bar ¢ bar € bar 𐍈 bar'); // 2,3,4 byte chars (in utf-8)
            rpc.call('foo', 'Árvíztűrő tükörfúrógép');
            rpc.call('foo', {bar: 10, arrayz: [50, 'bla']});
            rpc.end(); // endOnFinish is true, so this will close both ends of the duplex stream

            return writeEndPromise.then(writtenString => {
                const objectStrings = writtenString.split(/\n/);
                assert.lengthOf(objectStrings, 5);
                assert.strictEqual(objectStrings[4], ''); // end of line of the last document

                const objects = objectStrings.slice(0, 4).map(objectString => JSON.parse(objectString));

                assert.deepEqual(objects[0], {
                    id: 0,
                    jsonrpc: '2.0',
                    method: 'いろはにほ',
                    params: [],
                });

                assert.deepEqual(objects[1], {
                    id: 1,
                    jsonrpc: '2.0',
                    method: 'foo',
                    params: [10, 'bar ¢ bar € bar 𐍈 bar'],
                });

                assert.deepEqual(objects[2], {
                    id: 2,
                    jsonrpc: '2.0',
                    method: 'foo',
                    params: ['Árvíztűrő tükörfúrógép'],
                });

                assert.deepEqual(objects[3], {
                    id: 3,
                    jsonrpc: '2.0',
                    method: 'foo',
                    params: [{bar: 10, arrayz: [50, 'bla']}],
                });
            });
        });
    });
});

