/* eslint prefer-rest-params: 'off' */
/* eslint max-nested-callbacks: 'off' */
'use strict';

const {describe, it, beforeEach} = require('mocha-sugar-free');
const {assert} = require('chai');
const through = require('through2');

const Wait = require('./Wait');
const JSONBird = require('../lib/JSONBird');

const END = Symbol('END');

describe('JSONBird handling string/buffer streams in objectMode', () => {
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
                writableMode: 'json-message',
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

            readStream = through.obj();

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

                readStream.write('{"jsonrpc": "2.0", "method": "いろはにほ", "params": [42,23], "id":0}');
                readStream.write('{"jsonrpc": "2.0", "method": "foo",       "params": [100, {"foo": "bar ¢ bar € bar 𐍈 bar"}],"id": 1}');
                readStream.write(
                    new Buffer('{"jsonrpc": "2.0", "method": "foo",      "params": ["Árvíztűrő tükörfúrógép"],"id": 2}', 'utf8')
                );
                readStream.write('{"jsonrpc": "2.0", "method": "foo",      "params": [], "id":3}\n\r\t     ');
                readStream.write('{"jsonrpc": "2.0", "method": "foo",      "params": [], "id":4}\r\n');
                readStream.write('{"jsonrpc": "2.0", "method": "foo",      "params": [], "id":4}\r\n');

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

        it('should reply about parsing errors', () => {
            readStream.pipe(rpc);
            rpc.pipe(writeStream);

            return Promise.resolve()
            .then(() => {
                readStream.write('{"foo": 123]}');
                readStream.write('{"foo": 123]}');
                readStream.write(
                    // two json objects in one message:
                    '{"jsonrpc": "2.0", "method": "foo", "params": [],"id": 0}{"jsonrpc": "2.0", "method": "foo", "params": [],"id": 1}'
                );

                return writeWait.wait(3);
            })
            .then(() => {
                assert.lengthOf(writeEvents, 3);
                assert.lengthOf(errorEvents, 0);
                assert.lengthOf(protocolErrorEvents, 3);

                for (let i = 0; i < 3; ++i) {
                    assert.deepEqual(Object.keys(writeEvents[i]).sort(), ['error', 'id', 'jsonrpc']);
                    assert.strictEqual(writeEvents[i].jsonrpc, '2.0');
                    assert.strictEqual(writeEvents[i].id, null);
                    assert.deepEqual(Object.keys(writeEvents[i].error).sort(), ['code', 'message']);
                    assert.strictEqual(writeEvents[i].error.code, -32700);
                    assert.isAtLeast(writeEvents[i].error.message.length, 10);
                }
            });
        });
    });

    describe('as a client', () => {
        let rpc = null;
        let errorEvents = null;
        let protocolErrorEvents = null;
        let readStream = null;
        let writeStream = null;
        let writeEvents = null;
        let writeWait = null;

        beforeEach(() => {
            writeEvents = [];
            writeWait = new Wait();
            errorEvents = [];
            protocolErrorEvents = [];

            rpc = new JSONBird({
                sessionId: null,
                writableMode: 'object',
                readableMode: 'json-message',
                endOfJSONWhitespace: '\n',
            });

            rpc.on('error', error => {
                // console.log('error event', error);
                errorEvents.push(error);
            });

            rpc.on('protocolError', error => {
                // console.log('protocolError event', error);
                protocolErrorEvents.push(error);
            });

            readStream = through.obj();

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

        it('should write proper json strings', () => {
            readStream.pipe(rpc);
            rpc.pipe(writeStream);

            rpc.call('いろはにほ');
            rpc.call('foo', 10, 'bar ¢ bar € bar 𐍈 bar'); // 2,3,4 byte chars (in utf-8)
            rpc.call('foo', 'Árvíztűrő tükörfúrógép');
            rpc.call('foo', {bar: 10, arrayz: [50, 'bla']});

            return writeWait.wait(4).then(() => {
                assert.lengthOf(writeEvents, 4);
                assert.lengthOf(errorEvents, 0);
                assert.lengthOf(protocolErrorEvents, 0);

                assert.deepEqual(JSON.parse(writeEvents[0]), {
                    id: 0,
                    jsonrpc: '2.0',
                    method: 'いろはにほ',
                    params: [],
                });

                assert.deepEqual(JSON.parse(writeEvents[1]), {
                    id: 1,
                    jsonrpc: '2.0',
                    method: 'foo',
                    params: [10, 'bar ¢ bar € bar 𐍈 bar'],
                });

                assert.deepEqual(JSON.parse(writeEvents[2]), {
                    id: 2,
                    jsonrpc: '2.0',
                    method: 'foo',
                    params: ['Árvíztűrő tükörfúrógép'],
                });

                assert.deepEqual(JSON.parse(writeEvents[3]), {
                    id: 3,
                    jsonrpc: '2.0',
                    method: 'foo',
                    params: [{bar: 10, arrayz: [50, 'bla']}],
                });
            });
        });
    });
});

