/* eslint prefer-rest-params: 'off' */
/* eslint max-nested-callbacks: 'off' */
'use strict';

const {describe, it, specify} = require('mocha-sugar-free');
const {assert} = require('chai');

const Wait = require('./Wait');
const JSONBird = require('../lib/JSONBird');
const RPCRequestError = require('../lib/RPCRequestError');

const NOOP = () => {};
const expectPromise = true;

describe('JSONBird', () => {

    describe('RPCRequestError', () => {
        it('should construct properly', () => {
            function myTestFunction() {
                return new RPCRequestError(Error('Hello!'));
            }

            const error = myTestFunction();
            assert.instanceOf(error, Error);
            assert.instanceOf(error, RPCRequestError);
            assert.strictEqual(error.name, 'RPCRequestError');
            assert.strictEqual(error.message, 'Hello!');
            assert.isString(error.stack);
            assert.include(error.stack, 'myTestFunction');
            assert.strictEqual(error.code, 0);
            assert.property(error, 'data');
            assert.isUndefined(error.data);
            assert.isString(error.toString());
            assert.include(error.toString(), 'RPCRequestError');
            assert.include(error.toString(), 'Hello!');

            const error2 = new RPCRequestError(Error('Hello!'), 1234, {foo: [{bar: 'baz'}]});
            assert.strictEqual(error2.code, 1234);
            assert.deepEqual(error2.data, {foo: [{bar: 'baz'}]});

            assert.match((new RPCRequestError(Error(''), -32700)).message, /parse error/i);
            assert.match((new RPCRequestError(Error(''), -32600)).message, /invalid request/i);
            assert.match((new RPCRequestError(Error(''), -32601)).message, /method not found/i);
            assert.match((new RPCRequestError(Error(''), -32602)).message, /invalid params/i);
            assert.match((new RPCRequestError(Error(''), -32603)).message, /internal error/i);
            assert.match((new RPCRequestError(Error(''), -32000)).message, /timed out/i);
            assert.match((new RPCRequestError(Error(''), -32099)).message, /server error/i);
            assert.match((new RPCRequestError(Error(''), -32050)).message, /server error/i);
            assert.match((new RPCRequestError(Error(''), -32001)).message, /server error/i);
            assert.strictEqual((new RPCRequestError(Error(''), 123)).message, '');
        });
    });

    describe('construction', () => {
        it('should throw for invalid options', () => {
            assert.throws(() => {
                new JSONBird({
                    writableMode: 'foo',
                });
            }, /invalid.*writableMode/i);

            assert.throws(() => {
                new JSONBird({
                    readableMode: 'foo',
                });
            }, /invalid.*readableMode/i);

            assert.throws(() => {
                new JSONBird({
                    endOfJSONWhitespace: 123,
                });
            }, /endOfJSONWhitespace.*must.*string/i);

            assert.throws(() => {
                new JSONBird({
                    endOfJSONWhitespace: ' foo\n',
                });
            }, /endOfJSONWhitespace.*only.*whitespace/i);
        });

        it('should generate a random session id by default', () => {
            const rpc = new JSONBird();
            assert.isString(rpc.sessionId);
            assert.isAtLeast(rpc.sessionId.length, 5);
            assert.strictEqual(rpc.generateId(), '0 ' + rpc.sessionId);
            assert.strictEqual(rpc.generateId(), '1 ' + rpc.sessionId);
            assert.strictEqual(rpc.generateId(), '2 ' + rpc.sessionId);

            const rpc2 = new JSONBird();
            const rpc3 = new JSONBird();

            assert.notEqual(rpc.sessionId, rpc2.sessionId);
            assert.notEqual(rpc.sessionId, rpc3.sessionId);
            assert.notEqual(rpc2.sessionId, rpc3.sessionId);

            assert.strictEqual(rpc2.generateId(), '0 ' + rpc2.sessionId);
            assert.strictEqual(rpc2.generateId(), '1 ' + rpc2.sessionId);
            assert.strictEqual(rpc2.generateId(), '2 ' + rpc2.sessionId);
        });

        it('should disable prepending a session if sessionId is null or empty', () => {
            const rpc = new JSONBird({sessionId: null});
            assert.strictEqual(rpc.sessionId, '');
            assert.strictEqual(rpc.generateId(), 0);
            assert.strictEqual(rpc.generateId(), 1);
            assert.strictEqual(rpc.generateId(), 2);

            const rpc2 = new JSONBird({sessionId: ''});
            assert.strictEqual(rpc2.sessionId, '');
            assert.strictEqual(rpc2.generateId(), 0);
            assert.strictEqual(rpc2.generateId(), 1);
            assert.strictEqual(rpc2.generateId(), 2);
        });

        it('should have defaults for all options', () => {
            const rpc = new JSONBird();
            assert.strictEqual(rpc.writableMode, 'json-stream');
            assert.strictEqual(rpc.readableMode, 'json-stream');
            assert.strictEqual(rpc.sendErrorStack, false); // might expose sensitive data, so disabled by default
            // sessionId is already tested
        });

        it('should properly parse simple options', () => {
            const rpc = new JSONBird({
                writableMode: 'object',
                readableMode: 'object',
                sendErrorStack: true,
            });

            assert.strictEqual(rpc.writableMode, 'object');
            assert.strictEqual(rpc.readableMode, 'object');
            assert.strictEqual(rpc.sendErrorStack, true);
        });

        it('should properly wrap request id\'s', () => {
            const rpc = new JSONBird({
                sessionId: null,
                firstRequestId: Math.pow(2, 53) - 2,
            });

            assert.strictEqual(9007199254740992, 9007199254740992 + 1);

            assert.strictEqual(rpc.generateId(), 9007199254740990);
            assert.strictEqual(rpc.generateId(), 9007199254740991);
            assert.strictEqual(rpc.generateId(), 9007199254740992);
            assert.strictEqual(rpc.generateId(), -9007199254740992);
            assert.strictEqual(rpc.generateId(), -9007199254740991);
            assert.strictEqual(rpc.generateId(), -9007199254740990);
        });
    });

    describe('should check the arguments of', () => {
        specify('callLocal', () => {
            const rpc = new JSONBird();

            return Promise.all([
                rpc.callLocal()    .then(() => assert(false)).catch(error => assert.match(error.message, /argument.*must.*string/i)),
                rpc.callLocal({})  .then(() => assert(false)).catch(error => assert.match(error.message, /argument.*must.*string/i)),
                rpc.callLocal(null).then(() => assert(false)).catch(error => assert.match(error.message, /argument.*must.*string/i)),
            ]);
        });

        specify('callLocalAndSendResponse', () => {
            const rpc = new JSONBird();

            return Promise.all([
                rpc.callLocalAndSendResponse({}, 'bla')       .then(() => assert(false))
                    .catch(error => assert.match(error.message, /argument.*valid id/i)),

                rpc.callLocalAndSendResponse(undefined, 'bla').then(() => assert(false))
                    .catch(error => assert.match(error.message, /argument.*valid id/i)),

                rpc.callLocalAndSendResponse(null, 'bla')     .then(() => assert(false))
                    .catch(error => assert.match(error.message, /argument.*valid id/i)),

                rpc.callLocalAndSendResponse({}, 'bla')       .then(() => assert(false))
                    .catch(error => assert.match(error.message, /argument.*valid id/i)),

                rpc.callLocalAndSendResponse(undefined, 'bla').then(() => assert(false))
                    .catch(error => assert.match(error.message, /argument.*valid id/i)),
            ]);
        });

        specify('call', () => {
            const rpc = new JSONBird();

            /* eslint no-useless-call: 'off' */
            return Promise.all([
                rpc.call()    .then(() => assert(false))
                    .catch(error => assert.match(error.message, /argument.*must.*string.*object/i)),

                rpc.call({})  .then(() => assert(false))
                    .catch(error => assert.match(error.message, /argument.*must.*string.*object/i)),

                rpc.call(null).then(() => assert(false))
                    .catch(error => assert.match(error.message, /argument.*must.*string.*object/i)),

                rpc.call(123).then(() => assert(false))
                    .catch(error => assert.match(error.message, /argument.*must.*string.*object/i)),
            ]);
        });

        specify('notifyLocal', () => {
            const rpc = new JSONBird();

            return Promise.all([
                rpc.notifyLocal()    .then(() => assert(false))
                    .catch(error => assert.match(error.message, /argument.*must.*string/i)),

                rpc.notifyLocal({})  .then(() => assert(false))
                    .catch(error => assert.match(error.message, /argument.*must.*string/i)),

                rpc.notifyLocal(null).then(() => assert(false))
                    .catch(error => assert.match(error.message, /argument.*must.*string/i)),

                rpc.notifyLocal(123).then(() => assert(false))
                    .catch(error => assert.match(error.message, /argument.*must.*string/i)),
            ]);
        });

        specify('notify', () => {
            const rpc = new JSONBird();

            return Promise.all([
                rpc.notify()    .then(() => assert(false))
                    .catch(error => assert.match(error.message, /argument.*must.*string.*object/i)),

                rpc.notify({})  .then(() => assert(false))
                    .catch(error => assert.match(error.message, /argument.*must.*string.*object/i)),

                rpc.notify(null).then(() => assert(false))
                    .catch(error => assert.match(error.message, /argument.*must.*string.*object/i)),

                rpc.notify(123).then(() => assert(false))
                    .catch(error => assert.match(error.message, /argument.*must.*string.*object/i)),
            ]);
        });
    });

    describe('method() and callLocal()', () => {
        it('should accept a single function', {expectPromise}, () => {
            const rpc = new JSONBird();
            rpc.method('multiply', (a, b) => a * b);
            rpc.method('noop', NOOP);

            return rpc.callLocal('multiply', 10, 3).then(result => assert.strictEqual(result, 30));
        });

        it('should override a function with the same name', {expectPromise}, () => {
            const rpc = new JSONBird();
            rpc.method('multiply', (a, b) => a / b);
            rpc.method('multiply', (a, b) => a * b);

            return rpc.callLocal('multiply', 10, 3).then(result => assert.strictEqual(result, 30));
        });

        it('should throw for invalid arguments', () => {
            const rpc = new JSONBird();

            assert.throws(() => rpc.method(123, NOOP), /argument.*string/i);
            assert.throws(() => rpc.method({}, NOOP), /argument.*string/i);
            assert.throws(() => rpc.method(NOOP), /argument.*string/i);
            assert.throws(() => rpc.method('foo', 'bar'), /argument.*function/i);
            assert.throws(() => rpc.method('foo', 123), /argument.*function/i);
            assert.throws(() => rpc.method('foo'), /argument.*function/i);
        });
    });

    describe('methods() and callLocal()', () => {
        it('should accept multiple functions using an object', {expectPromise}, () => {
            const rpc = new JSONBird();

            const object = {
                add(a, b) {
                    assert.strictEqual(this, object);

                    return a + b;
                },

                divide: (a, b) => a / b,
            };

            rpc.methods(object);

            return rpc.callLocal('add', 10, 3)
                .then(result => rpc.callLocal('divide', result, 2))
                .then(result => assert.strictEqual(result, 6.5));
        });

        it('should accept multiple functions using multiple objects', {expectPromise}, () => {
            const rpc = new JSONBird();

            const object0 = {
                add(a, b) {
                    assert.strictEqual(this, object0);

                    return a + b;
                },

                divide: (a, b) => a / b,
            };

            const object1 = {
                subtract(a, b) {
                    assert.strictEqual(this, object1);

                    return a - b;
                },
            };

            rpc.methods(object0);
            rpc.methods(object1);

            return rpc.callLocal('add', 10, 3)
                .then(result => rpc.callLocal('divide', result, 2))
                .then(result => rpc.callLocal('subtract', result, 1))
                .then(result => assert.strictEqual(result, 5.5));
        });

        it('should override a function with the same name', {expectPromise}, () => {
            const rpc = new JSONBird();

            const object0 = {
                divide: (a, b) => a * b,
            };

            const object1 = {
                divide: (a, b) => a / b,
            };

            rpc.methods(object0);
            rpc.methods(object1);

            return rpc.callLocal('divide', 10, 4)
                .then(result => assert.strictEqual(result, 2.5));
        });

        it('should accept multiple functions using a Map', {expectPromise}, () => {
            const rpc = new JSONBird();

            rpc.methods(new Map([
                [
                    'add',
                    function(a, b) {
                        assert.strictEqual(this, undefined);

                        return a + b;
                    },
                ],
                ['divide', (a, b) => a / b],
            ]));

            return rpc.callLocal('add', 10, 3)
                .then(result => rpc.callLocal('divide', result, 2))
                .then(result => assert.strictEqual(result, 6.5));
        });

        it('should throw for methods that do not exist', () => {
            const rpc = new JSONBird();

            rpc.methods({
                add: (a, b) => a + b,
            });

            return rpc.callLocal('foo', 10, 3)
            .then(() => {
                assert(false);
            }, error => {
                assert.instanceOf(error, RPCRequestError);
                assert.instanceOf(error, Error);
                assert.strictEqual(error.name, 'RPCRequestError');
                assert.strictEqual(error.code, -32601);
                assert.strictEqual(error.message, 'Method not found');
            });
        });

        it('should not allow calling Object builtins', () => {
            const rpc = new JSONBird();

            rpc.methods({
                add: (a, b) => a + b,
            });

            const calls = [
                rpc.callLocal('__proto__'),
                rpc.callLocal('hasOwnProperty'),
                rpc.callLocal('isPrototypeOf'),
                rpc.callLocal('constructor'),
                rpc.callLocal('propertyIsEnumerable'),
                rpc.callLocal('toLocaleString'),
                rpc.callLocal('toString'),
                rpc.callLocal('unwatch'),
                rpc.callLocal('valueOf'),
                rpc.callLocal('watch'),
            ];

            if (Object.prototype.__defineGetter__) {
                calls.push(
                    rpc.callLocal('__defineGetter__'),
                    rpc.callLocal('__defineSetter__'),
                    rpc.callLocal('__lookupGetter__'),
                    rpc.callLocal('__lookupSetter__')
                );
            }

            return Promise.all(
                calls.map(
                    promise => promise.then(
                        () => assert(false),
                        error => error
                    )
                )
            )
            .then(errors => {
                // eslint-disable-next-line prefer-const
                for (let error of errors) {
                    assert.instanceOf(error, RPCRequestError);
                    assert.instanceOf(error, Error);
                    assert.strictEqual(error.name, 'RPCRequestError');
                    assert.strictEqual(error.code, -32601);
                    assert.strictEqual(error.message, 'Method not found');
                }
            });
        });

        it('should allow calling Object builtins if they have been redefined', () => {
            const rpc = new JSONBird();

            rpc.methods({
                hasOwnProperty: (a, b) => a + b,
                valueOf: (a, b) => a / b,
                propertyIsEnumerable: (a, b) => a - b,
            });

            return rpc.callLocal('hasOwnProperty', 10, 3)
                .then(result => rpc.callLocal('valueOf', result, 2))
                .then(result => rpc.callLocal('propertyIsEnumerable', result, 1))
                .then(result => assert.strictEqual(result, 5.5));
        });

        it('should allow calling Object builtins if they have been redefined on a subclass', () => {
            const rpc = new JSONBird();

            class Bar {
                hasOwnProperty(a, b) {
                    return a + b;
                }
            }

            class Foo extends Bar {
                valueOf(a, b) {
                    return a / b;
                }

                propertyIsEnumerable(a, b) {
                    return a - b;
                }
            }

            rpc.methods(new Foo());

            return rpc.callLocal('hasOwnProperty', 10, 3)
                .then(result => rpc.callLocal('valueOf', result, 2))
                .then(result => rpc.callLocal('propertyIsEnumerable', result, 1))
                .then(result => assert.strictEqual(result, 5.5));
        });

        it('should allow calling Object builtins if they have been redefined and Object.create(null) was used', () => {
            const rpc = new JSONBird();

            const object = Object.create(null);
            object.hasOwnProperty = (a, b) => a + b;
            object.valueOf = (a, b) => a / b;
            object.propertyIsEnumerable = (a, b) => a - b;
            rpc.methods(object);

            return rpc.callLocal('hasOwnProperty', 10, 3)
                .then(result => rpc.callLocal('valueOf', result, 2))
                .then(result => rpc.callLocal('propertyIsEnumerable', result, 1))
                .then(result => assert.strictEqual(result, 5.5));
        });

        it('should throw for invalid arguments', () => {
            const rpc = new JSONBird();

            assert.throws(() => rpc.methods(123), /argument.*object/i);
            assert.throws(() => rpc.methods(NOOP), /argument.*object/i);
            assert.throws(() => rpc.methods('foo'), /argument.*object/i);
            assert.throws(() => rpc.methods(), /argument.*object/i);
        });
    });

    describe('notification() and notifyLocal()', () => {
        it('should accept a single function', {expectPromise}, () => {
            const rpc = new JSONBird();
            const foos = [];
            const errors = [];

            rpc.on('error', error => errors.push(error));
            rpc.notification('foo', (a, b) => foos.push([a, b]));

            return rpc.notifyLocal('foo', 10, 'b').then(result => {
                assert.isUndefined(result);
                assert.lengthOf(errors, 0);
                assert.deepEqual(foos, [[10, 'b']]);

                return rpc.notifyLocal('foo');
            })
            .then(() => assert.deepEqual(foos, [[10, 'b'], [undefined, undefined]]));
        });

        it('should not cause error for an unknown name', {expectPromise}, () => {
            const rpc = new JSONBird();
            const errors = [];

            rpc.notification('foo', () => assert(false));

            return rpc.notifyLocal('baz', 10, 'b').then(result => {
                assert.isUndefined(result);
                assert.lengthOf(errors, 0);
            });
        });

        it('should accept a single function which throws', {expectPromise}, () => {
            const rpc = new JSONBird();
            const errors = [];
            const errorsWait = new Wait();
            const myError = Error('foo');

            rpc.on('error', error => {
                errors.push(error);
                errorsWait.advance();
            });

            rpc.notification('foo', () => {
                throw myError;
            });

            return rpc.notifyLocal('foo', 10, 'b').then(result => {
                assert.isUndefined(result);

                return errorsWait.wait(1);
            }).then(() => {
                assert.lengthOf(errors, 1);
                assert.strictEqual(errors[0], myError);
            });
        });

        it('should accept multiple functions with the same name', {expectPromise}, () => {
            const rpc = new JSONBird();
            const foos = [];
            const bars = [];

            rpc.notification('foo', () => foos.push('a'));
            rpc.notification('foo', () => foos.push('b'));
            rpc.notification('bar', () => bars.push('d'));
            rpc.notification('foo', () => foos.push('c'));

            return rpc.notifyLocal('foo')
            .then(() => rpc.notifyLocal('bar'))
            .then(() => {
                assert.deepEqual(foos, ['a', 'b', 'c']);
                assert.deepEqual(bars, ['d']);
            });
        });

        it('should accept multiple functions with the same name which throw', {expectPromise}, () => {
            const rpc = new JSONBird();
            const errors = [];
            const foos = [];
            const bars = [];

            rpc.on('error', error => {
                errors.push(error);
            });

            rpc.notification('foo', () => {
                foos.push('a');
                throw Error('a'); // should not interrupt the next function for the same name
            });

            rpc.notification('foo', () => {
                foos.push('b');
                throw Error('b');
            });

            rpc.notification('bar', () => {
                bars.push('d');
                throw Error('d');
            });

            rpc.notification('foo', () => {
                foos.push('c');
                throw Error('c');
            });

            return rpc.notifyLocal('foo')
            .then(() => rpc.notifyLocal('bar'))
            .then(() => {
                assert.deepEqual(foos, ['a', 'b', 'c']);
                assert.deepEqual(bars, ['d']);
                assert.lengthOf(errors, 4);
                assert.strictEqual(errors[0].message, 'a');
                assert.strictEqual(errors[1].message, 'b');
                assert.strictEqual(errors[2].message, 'c');
                assert.strictEqual(errors[3].message, 'd');
            });
        });

        it('should throw for invalid arguments', () => {
            const rpc = new JSONBird();

            assert.throws(() => rpc.notification(123, NOOP), /argument.*string/i);
            assert.throws(() => rpc.notification({}, NOOP), /argument.*string/i);
            assert.throws(() => rpc.notification(NOOP), /argument.*string/i);
            assert.throws(() => rpc.notification('foo', 'bar'), /argument.*function/i);
            assert.throws(() => rpc.notification('foo', 123), /argument.*function/i);
            assert.throws(() => rpc.notification('foo'), /argument.*function/i);
        });

        it('should ignore reserved names', {expectPromise}, () => {
            const rpc = new JSONBird();
            const foos = [];
            const errors = [];

            rpc.notification('rpc.foo', () => foos.push('bla'));

            return rpc.notifyLocal('rpc.foo').then(result => {
                assert.isUndefined(result);
                assert.lengthOf(errors, 0);
                assert.lengthOf(foos, 0);
            });
        });
    });

    describe('notifications() and notifyLocal()', () => {
        it('should accept multiple functions using an object', {expectPromise}, () => {
            const rpc = new JSONBird();
            const foos = [];
            const bars = [];
            const errors = [];

            rpc.on('error', error => errors.push(error));

            const object = {
                foo(a, b) {
                    assert.strictEqual(this, object);
                    foos.push([a, b]);
                },

                bar() {
                    assert.strictEqual(this, object);
                    bars.push('bar');
                },
            };

            rpc.notifications(object);

            return rpc.notifyLocal('foo', 50, 'bla')
            .then(() => rpc.notifyLocal('bar'))
            .then(() => {
                assert.lengthOf(errors, 0);
                assert.deepEqual(foos, [[50, 'bla']]);
                assert.deepEqual(bars, ['bar']);
            });
        });

        it('should accept multiple functions using multiple objects', {expectPromise}, () => {
            const rpc = new JSONBird();
            const foos = [];
            const errors = [];

            rpc.on('error', error => errors.push(error));

            const object = {
                foo(a, b) {
                    assert.strictEqual(this, object);
                    foos.push('foo');
                },

                bar() {
                    assert.strictEqual(this, object);
                    foos.push('bar');
                },

                get someProp() {
                    return 123;
                },
            };

            rpc.notifications(object);
            rpc.notifications(object);
            rpc.notifications(object);

            return rpc.notifyLocal('foo', 'bla')
            .then(() => rpc.notifyLocal('bar'))
            .then(() => rpc.notifyLocal('someProp'))
            .then(() => {
                assert.lengthOf(errors, 0);
                assert.deepEqual(foos, ['foo', 'foo', 'foo', 'bar', 'bar', 'bar']);
            });
        });

        it('should accept multiple functions using multiple maps', {expectPromise}, () => {
            const rpc = new JSONBird();
            const foos = [];
            const errors = [];

            rpc.on('error', error => errors.push(error));

            const map = new Map([
                [
                    'foo',
                    function(a, b) {
                        assert.strictEqual(this, undefined);
                        foos.push('foo');
                    },
                ],

                [
                    'bar',
                    function() {
                        assert.strictEqual(this, undefined);
                        foos.push('bar');
                    },
                ],

                ['notAFunc', 123],
            ]);

            rpc.notifications(map);
            rpc.notifications(map);
            rpc.notifications(map);

            return rpc.notifyLocal('foo', 'bla')
            .then(() => rpc.notifyLocal('bar'))
            .then(() => rpc.notifyLocal('notAFunc'))
            .then(() => {
                assert.lengthOf(errors, 0);
                assert.deepEqual(foos, ['foo', 'foo', 'foo', 'bar', 'bar', 'bar']);
            });
        });

        it('should throw for invalid arguments', () => {
            const rpc = new JSONBird();

            assert.throws(() => rpc.notifications(123), /argument.*object/i);
            assert.throws(() => rpc.notifications(NOOP), /argument.*object/i);
            assert.throws(() => rpc.notifications('foo'), /argument.*object/i);
            assert.throws(() => rpc.notifications(), /argument.*object/i);
        });
    });
});
