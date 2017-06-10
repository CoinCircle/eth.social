'use strict';

const {Duplex} = require('readable-stream');
const shortid = require('shortid');
const JSONParser = require('jsonparse');

const RPCRequestError = require('./RPCRequestError');
const RPCResponseError = require('./RPCResponseError');
const prom = require('./promiseExtras');
const getRootPrototype = require('./getRootPrototype');

const NOOP = () => {};
const RETURN_TRUE = () => true;
const PRIVATE = Symbol('JSONBird PRIVATE');
const REQUEST_ERROR_ID = Symbol('JSONBird RPCRequestError id');
const DEFAULT_OPTIONS = {
    receiveErrorStack: false,
    sendErrorStack: false,
    writableMode: 'json-stream',
    readableMode: 'json-stream',
    endOfJSONWhitespace: '',
    sessionId: undefined,
    firstRequestId: 0,
    defaultTimeout: 0,
    endOnFinish: true,
    finishOnEnd: true,
    pingReceive: true,
    pingMethod: 'jsonbird.ping',
    pingInterval: 2000,
    pingTimeout: 1000,
    pingNow: Date.now.bind(Date),
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
};

const getObjectTag = object => Object.prototype.toString.call(object);
const objectBuiltins = new Set(Object.getOwnPropertyNames(Object.prototype));

/**
 * JSONBird is a Duplex stream which makes it easy to create a flexible JSON-RPC 2.0 client or server (or a bidirectional combination)
 * over any reliable transport. You can use out of order messaging or an in-order byte stream.
 */
class JSONBird extends Duplex {
    /**
     * This event is fired if an uncaught error occurred
     *
     * Most errors end up at the caller of our functions or at the remote peer, instead of this event.
     * Note that if you do not listen for this event on node.js, your process might exit.
     *
     * @event JSONBird#error
     * @param {Error} error
     */

    /**
     * This event is fired if our peer sent us something that we were unable to parse.
     *
     * These kind of errors do not end up at the 'error' event
     *
     * @event JSONBird#protocolError
     * @param {Error} error
     */

    /**
     * The most recent ping sent to our peer succeeded
     *
     * @event JSONBird#pingSuccess
     * @param {number} delay How long the ping took to resolve (in milliseconds)
     */

    /**
     * The most recent ping sent to our peer timed out or resulted in an error
     *
     * @event JSONBird#pingFail
     * @param {number} consecutiveFails The amount of consecutive pings that failed
     * @param {Error} error
     */

    /**
     * Converts any javascript `Error` object to a JSON-RPC error object
     *
     * @param {Error} error The `message`, `code` and `data` properties of this `error` will be copied over to the resulting object.
     * @param {boolean} [includeErrorStack=false] If `true` and `error.data` is `undefined`, the resulting `data` property will be an
     *        object containing the `fileName`, `lineNumber`, `columnNumber` and `stack` of the `error`
     * @return {{code: number, message: string, data: *}}
     */
    static errorToResponseObject(error, includeErrorStack) {
        const responseError = {};
        responseError.code = Number(error.code) || 0;
        responseError.message = String(error.message);

        if (error.data !== undefined) {
            responseError.data = error.data;
        }

        if (includeErrorStack && responseError.data === undefined) {
            responseError.data = {
                isJSError: true,
                name: error.name,
                fileName: String(error.fileName),
                lineNumber: Number(error.lineNumber),
                columnNumber: Number(error.columnNumber),
                stack: String(error.stack),
            };
        }

        return responseError;
    }

    /**
     * Is the given value for the JSON-RPC `jsonrpc` property a value that we recognise?
     *
     * Currently, only "2.0" is supported
     *
     * @param {*} jsonrpc
     * @return {boolean}
     */
    static isValidVersion(jsonrpc) {
        return jsonrpc === '2.0';
    }

    /**
     * Is the given value for the JSON-RPC `id` property valid?
     *
     * @param {*} id
     * @return {boolean}
     */
    static isValidID(id) {
        return typeof id === 'number' || typeof id === 'string';
    }

    /**
     * Is the given value for the JSON-RPC `method` property valid?
     *
     * @param {*} method
     * @return {boolean}
     */
    static isValidMethodName(method) {
        return typeof method === 'string';
    }

    /**
     * Is the given value for the JSON-RPC `params` property valid?
     *
     * @param {*} params
     * @return {boolean}
     */
    static isValidParams(params) {
        return Boolean(params && (Array.isArray(params) || typeof params === 'object'));
    }

    /**
     * Test if the given property `name` of `object` is one of the builtin Object.prototype functions.
     *
     * Such as: hasOwnProperty, __defineGetter__, etc
     *
     * @param {Object} object
     * @param {string} name
     * @return {boolean}
     */
    static isObjectBuiltinFunction(object, name) {
        const method = object[name];

        if (typeof method === 'function' && objectBuiltins.has(name)) {
            const rootProto = getRootPrototype(object);

            if (rootProto && method === rootProto[name]) {
                // Do not allow methods from Object (like __defineGetter__) to be called...
                // Unless they have been overridden on the object itself, or a prototype that is not the top most prototype.
                // `Object.prototype` is nt used directly, to support cross realm objects (a different realm has a different
                // `Object`)
                return true;
            }
        }

        return false;
    }

    /**
     * @param {Object} [optionsArg] The effect of these options are documented at the getter/setter with the same name
     * @param {boolean} [optionsArg.receiveErrorStack=false]
     * @param {boolean} [optionsArg.sendErrorStack=false]
     * @param {string} [optionsArg.writableMode=json-stream]
     * @param {string} [optionsArg.readableMode=json-stream]
     * @param {number} [optionsArg.firstRequestId=0] The first request id to use
     * @param {string} [optionsArg.sessionId=randomString()]
     * @param {string} [optionsArg.endOfJSONWhitespace=]
     * @param {boolean} [optionsArg.endOnFinish=true]
     * @param {boolean} [optionsArg.finishOnEnd=true]
     * @param {boolean} [optionsArg.pingReceive=true]
     * @param {string} [optionsArg.pingMethod='jsonbird.ping']
     * @param {number} [optionsArg.pingInterval=2000]
     * @param {number} [optionsArg.pingTimeout=1000]
     * @param {number} [optionsArg.pingNow=Date.now] Timer function used to figure out ping delays
     * @param {Function} [optionsArg.setTimeout=global.setTimeout]
     * @param {Function} [optionsArg.clearTimeout=global.clearTimeout]
     */
    constructor(optionsArg = {}) {
        const options = Object.assign({}, DEFAULT_OPTIONS, optionsArg);

        if (options.writableMode !== 'object' &&
            options.writableMode !== 'json-stream' &&
            options.writableMode !== 'json-message') {
            throw Error('Invalid value for `writableMode` option');
        }

        if (options.readableMode !== 'object' &&
            options.readableMode !== 'json-stream' &&
            options.readableMode !== 'json-message') {
            throw Error('Invalid value for `readableMode` option');
        }

        if (typeof options.endOfJSONWhitespace !== 'string') {
            throw Error('The `endOfJSONWhitespace` option must be a string');
        }

        // empty string is also valid, and is the default:
        if (/[^\x20\x09\x0a\x0d]/.test(options.endOfJSONWhitespace)) {
            throw Error('The `endOfJSONWhitespace` option must only contain whitespace characters (whitespace as defined in rfc4627)');
        }

        super({
            allowHalfOpen: true,
            decodeStrings: false, // disable string -> Buffer conversion for _write
            readableObjectMode: options.readableMode === 'object' || options.readableMode === 'json-message',
            writableObjectMode: options.writableMode === 'object' || options.writableMode === 'json-message',
        });

        this[PRIVATE] = Object.seal({
            clientPendingMap: new Map(),
            defaultTimeout: 0,
            endOfJSONWhitespace: options.endOfJSONWhitespace,
            endOnFinish: false,
            ended: false, // Readable has ended
            finishOnEnd: false,
            finished: false, // Writable has finished
            methods: [],
            nextId: Math.floor(options.firstRequestId) || 0,
            notifications: [],
            pendingRequestPromise: Promise.resolve(),
            pendingResponsesPromise: Promise.resolve(),
            readJSONParser: null,
            readJSONParserValues: [],
            readableMode: options.readableMode,
            receiveErrorStack: false,
            sendErrorStack: false,
            serverPending: 0,
            sessionId: String(options.sessionId === undefined ? shortid.generate() : (options.sessionId || '')),
            writableMode: options.writableMode,
            pingReceive: Boolean(options.pingReceive),
            pingMethod: String(options.pingMethod),
            pingInterval: 0,
            pingTimeout: 0,
            pingNow: options.pingNow,
            isSendingPings: false,
            pingTimer: 0,
            pingConsecutiveFails: 0,
            setTimeout: options.setTimeout,
            clearTimeout: options.clearTimeout,
        });

        this.receiveErrorStack = options.receiveErrorStack;
        this.sendErrorStack = options.sendErrorStack;
        this.defaultTimeout = options.defaultTimeout;
        this.endOnFinish = options.endOnFinish;
        this.finishOnEnd = options.finishOnEnd;
        this.pingInterval = options.pingInterval;
        this.pingTimeout = options.pingTimeout;

        if (this.writableMode === 'json-stream') {
            const readJSONParser = new JSONParser();
            this[PRIVATE].readJSONParser = readJSONParser;

            readJSONParser.onValue = value => {
                if (readJSONParser.stack.length === 0) { // full object
                    this[PRIVATE].readJSONParserValues.push(value);
                }
            };
        }

        this.on('finish', () => {
            // our writable stream is finished, we will no longer receive any data (_write)
            this[PRIVATE].finished = true;
            this.stopPinging();

            if (this.endOnFinish && !this[PRIVATE].ended) {
                // end our read stream as soon as all of our outgoing objects have been sent
                this.waitForPendingResponses().then(() => {
                    this.push(null); // end
                });
            }
        });

        this.on('end', () => {
            // our readable stream has ended, we will no longer be able to send any data
            this[PRIVATE].ended = true;
            this.stopPinging();

            if (this.finishOnEnd && !this.finished) {
                this.waitForPendingRequests().then(() => {
                    this.end(); // finish
                });
            }
        });

        if (this.pingReceive) {
            this.method(this.pingMethod, RETURN_TRUE);
        }
    }

    /**
     * Generate a new id to be used for an outgoing request object
     *
     * @return {string|number}
     */
    generateId() {
        const priv = this[PRIVATE];
        const id = priv.nextId;

        if (priv.nextId >= 9007199254740992) {
            priv.nextId = -9007199254740992;
        }
        else {
            ++priv.nextId;
        }

        return priv.sessionId ? id + ' ' + priv.sessionId : id;
    }

    /**
     * The HTML setTimeout function
     *
     * This function may be overridden for unit tests
     * @return {Function} https://html.spec.whatwg.org/#dom-settimeout
     */
    get setTimeout() {
        return this[PRIVATE].setTimeout;
    }

    /**
     * The HTML clearTimeout function
     *
     * This function may be overridden for unit tests
     * @return {Function} https://html.spec.whatwg.org/#dom-cleartimeout
     */
    get clearTimeout() {
        return this[PRIVATE].clearTimeout;
    }

    /**
     * Has the readable side of this duplex stream been ended?
     *
     * (has the 'end' event been emitted)
     *
     * @return {boolean}
     */
    get ended() {
        return this[PRIVATE].ended;
    }

    /**
     * Has the writable side of this duplex stream been finished?
     *
     * (has the 'finish' event been emitted)
     *
     * @return {boolean}
     */
    get finished() {
        return this[PRIVATE].finished;
    }

    /**
     * This is a string that will be appended to the id of all request objects that we send out.
     *
     * This is useful in case the same transport is reused, to make sure that we do not parse any stale response objects.
     * By default, this is set to a short unique id (using the "shortid" module)
     *
     * @return {string}
     */
    get sessionId() {
        return this[PRIVATE].sessionId;
    }

    /**
     * Determines how to JSONBird interprets messages that are written to the writable side of this Duplex stream.
     *
     * If the value is "object", the writable stream is put in object mode and a plain old javascript object is expected.
     *
     * For example:
     * ```javascript
     * rpc.write({jsonrpc: '2.0', method: 'subtract', params: [42, 23], id: 0})
     * ```
     *
     * If the value is "json-message", the writable stream is put in object mode and a json string or a Buffer (utf8) is expected,
     *
     * For example:
     * ```javascript
     * rpc.write('{"jsonrpc":"2.0","method":"subtract","params":[42,23],"id":0}')
     * rpc.write('{"jsonrpc"') // invalid json string, a `protocolError` event will emitted
     * ```
     *
     * If the value is "json-stream", a streaming sequence of json strings or Buffers (utf8) are expected.
     *
     * For example:
     * ```javascript
     * // will wait until more data arrives to complete the json string:
     * rpc.write('{"jsonrpc":"2.0","method":"subt')
     * rpc.write('ract","params":[42,23],"id":0}{"jsonrpc"')
     * rpc.write(':"2.0","method":"subtract","params":[100,1],"id":1}')
     * ```
     *
     * @return {string} "object", "json-stream" or "json-message"
     */
    get writableMode() {
        return this[PRIVATE].writableMode;
    }

    /**
     * Determines how JSONBird sends messages to the readable side of this Duplex stream.
     *
     * If the value is "object", the readable stream is put in object mode and a plain old javascript object is sent.
     *
     * For example:
     * ```javascript
     * rpc.on('data', object => assert.deepEqual(object, {jsonrpc: '2.0', result: 19, id: 0}));
     * ```
     *
     * If the value is "json-message", the readable stream is put in object mode and a json string is sent.
     *
     * For example:
     * ```javascript
     * rpc.on('data', string => console.log('json string:', string));
     * // json string: {"jsonrpc":"2.0","result":19,"id":0}
     * // json string: {"jsonrpc":"2.0","result":99,"id":1}
     * ```
     *
     * If the value is "json-stream", a streaming sequence of json strings are sent.
     *
     * For example:
     * ```javascript
     * rpc.on('data', string => console.log('chunk:', string));
     * // chunk: {"jsonrpc":"2.0","res
     * // chunk: ult":19,"id":0}{"jsonrpc":"2.0",
     * // chunk: "result":99,"id":1}
     * ```
     *
     * @return {string} "object" or "json-stream"
     */
    get readableMode() {
        return this[PRIVATE].readableMode;
    }

    /**
     * This value is appended to the end of every json string sent to the readable stream.
     *
     * Only whitespace characters are allowed. This option only has an affect if `readableMode == 'json-stream'`
     *
     * @return {string}
     */
    get endOfJSONWhitespace() {
        return this[PRIVATE].endOfJSONWhitespace;
    }

    /**
     * If `true` and the writable side of this Duplex stream has finished, automatically end the readable side (after all pending
     * responses have been sent).
     *
     * @return {boolean}
     */
    get endOnFinish() {
        return this[PRIVATE].endOnFinish;
    }

    /**
     * If `true` and the writable side of this Duplex stream has finished, automatically end the readable side (after all pending
     * responses have been sent).
     *
     * @param {boolean} value
     */
    set endOnFinish(value) {
        this[PRIVATE].endOnFinish = Boolean(value);
    }

    /**
     * If `true` and the readable side of this Duplex stream has ended, automatically finish the writable side (after all pending
     * requests have received a response).
     *
     * @return {boolean}
     */
    get finishOnEnd() {
        return this[PRIVATE].finishOnEnd;
    }

    /**
     * If `true` and the readable side of this Duplex stream has ended, automatically finish the writable side (after all pending
     * requests have received a response).
     *
     * @param {boolean} value
     */
    set finishOnEnd(value) {
        this[PRIVATE].finishOnEnd = Boolean(value);
    }

    /**
     * The number of incoming RPC requests for which we have not sent a reply yet
     *
     * @return {number}
     */
    get serverPending() {
        return this[PRIVATE].serverPending;
    }

    /**
     * The number of outstanding RPC requests for which we have not yet received a response.
     *
     * @return {number}
     */
    get clientPending() {
        const {clientPendingMap} = this[PRIVATE];

        return clientPendingMap.size;
    }

    /**
     * If true and a remote method throws, attempt to read stack trace information from the JSON-RPC `error.data` property. This stack
     * trace information is then used to set the `fileName`, `lineNumber`, `columnNumber` and `stack` properties of our local `Error`
     * object (the Error object that the `.call()` function will reject with).
     *
     * @return {boolean}
     */
    get receiveErrorStack() {
        return this[PRIVATE].receiveErrorStack;
    }

    /**
     * If true and a remote method throws, attempt to read stack trace information from the JSON-RPC `error.data` property. This stack
     * trace information is then used to set the `fileName`, `lineNumber`, `columnNumber` and `stack` properties of our local `Error`
     * object (the Error object that the `.call()` function will reject with).
     *
     * @param {boolean} value
     */
    set receiveErrorStack(value) {
        this[PRIVATE].receiveErrorStack = Boolean(value);
    }

    /**
     * If true, the `fileName`, `lineNumber`, `columnNumber` and `stack` of an `Error` thrown during a method is sent to the client
     * using the JSON-RPC `error.data` property.
     *
     * @return {boolean}
     */
    get sendErrorStack() {
        return this[PRIVATE].sendErrorStack;
    }

    /**
     * If true, the `fileName`, `lineNumber`, `columnNumber` and `stack` of an `Error` thrown during a method is sent to the client
     * using the JSON-RPC `error.data` property.
     *
     * @param {boolean} value
     */
    set sendErrorStack(value) {
        this[PRIVATE].sendErrorStack = Boolean(value);
    }

    /**
     * The timeout to use for an outgoing method call unless a different timeout was explicitly specified to `call()`.
     *
     * @return {number}
     */
    get defaultTimeout() {
        return this[PRIVATE].defaultTimeout;
    }

    /**
     * The timeout to use for an outgoing method call unless a different timeout was explicitly specified to `call()`.
     *
     * @param {number} value
     */
    set defaultTimeout(value) {
        const number = Number(value);
        this[PRIVATE].defaultTimeout = number > 0 ? number : 0;
    }

    /**
     * If `true` a method with the name `this.pingMethod` is added which simply returns true as fast as possible.
     * @return {boolean}
     */
    get pingReceive() {
        return this[PRIVATE].pingReceive;
    }

    /**
     * Are we currently sending pings to our peer?
     *
     * In other words, has `this.startPinging()` been called?
     * @return {boolean}
     */
    get isSendingPings() {
        return this[PRIVATE].isSendingPings;
    }

    /**
     * The method name used when receiving or sending pings.
     * @return {string}
     */
    get pingMethod() {
        return this[PRIVATE].pingMethod;
    }

    /**
     * The time (in milliseconds) between each ping if `isSendingPings` is true.
     * This time is in addition to the time spent waiting for the previous ping to settle.
     *
     * @return {number} milliseconds
     */
    get pingInterval() {
        return this[PRIVATE].pingInterval;
    }

    /**
     * The time (in milliseconds) between each ping if `isSendingPings` is true.
     * This time is in addition to the time spent waiting for the previous ping to settle.
     *
     * @param {number} value milliseconds
     */
    set pingInterval(value) {
        this[PRIVATE].pingInterval = value;
    }

    /**
     * The maximum amount of time (in milliseconds) to wait for a ping method call to resolve.
     * @return {number} milliseconds
     */
    get pingTimeout() {
        return this[PRIVATE].pingTimeout;
    }

    /**
     * The maximum amount of time (in milliseconds) to wait for a ping method call to resolve.
     * @param {number} value milliseconds
     */
    set pingTimeout(value) {
        this[PRIVATE].pingTimeout = value;
    }

    /**
     * Returns a promise which resolves as soon as all pending requests (as a server) have had their appropriate responses sent to the
     * underlying readable stream.
     *
     * Note that if a new requests comes in after using waitForPendingResponses(), they will not further delay this Promise.
     *
     * @return {Promise}
     */
    waitForPendingResponses() {
        return this[PRIVATE].pendingResponsesPromise;
    }

    /**
     * Returns a promise which resolves as soon as all pending requests (as a client) have had their appropriate responses received from
     * the underlying writable stream.
     *
     * Note that if a new call() is made after using waitForPendingResponses(), it will not further delay this Promise.
     *
     * @return {Promise}
     */
    waitForPendingRequests() {
        return this[PRIVATE].pendingRequestPromise;
    }

    /**
     * Registers a new method with the given name.
     *
     * If the same method name is registered multiple times, earlier definitions will be overridden
     *
     * @param {string} name The method name
     * @param {Function} func
     */
    method(name, func) {
        if (typeof name !== 'string') {
            throw Error('First argument (name) must be a string');
        }

        if (typeof func !== 'function') {
            throw Error('Second argument (func) must be a function');
        }

        const {methods} = this[PRIVATE];
        const lastDefinition = methods[methods.length - 1];

        if (lastDefinition && lastDefinition.isSingleMethodMap) {
            // reuse the latest definition
            lastDefinition.map.set(name, func);
        }
        else {
            methods.push({
                isSingleMethodMap: true,
                map: new Map([[name, func]]),
                object: null,
            });
        }
    }

    /**
     * Registers multiple methods using an object or Map.
     *
     * Each key->value pair is registered as a method.
     * Values that are not a function are ignored.
     * The `this` object during a method call is set to the `objectOrMap` (unless a Map was used)
     *
     * If the same method name is registered multiple times, earlier definitions will be overridden
     *
     * @param {Object|Map} objectOrMap
     */
    methods(objectOrMap) {
        if (!objectOrMap || typeof objectOrMap !== 'object') {
            throw Error('First argument (objectOrMap) must be an object, or a Map');
        }

        const {methods} = this[PRIVATE];

        if (getObjectTag(objectOrMap) === '[object Map]') {
            methods.push({
                isSingleMethodMap: false,
                map: objectOrMap,
                object: null,
            });
        }
        else {
            methods.push({
                isSingleMethodMap: false,
                map: null,
                object: objectOrMap,
            });
        }
    }

    /**
     * Registers a notification with the given name.
     *
     * A notification is a method for which the return value or thrown Error is ignored. A response object is never sent.
     *
     * If the same method name is registered multiple times, all functions handlers will be called (in the same order as they were
     * registered)
     *
     * @param {string} name The method name
     * @param {Function} func
     */
    notification(name, func) {
        if (typeof name !== 'string') {
            throw Error('First argument (name) must be a string');
        }

        if (typeof func !== 'function') {
            throw Error('Second argument (func) must be a function');
        }

        const {notifications} = this[PRIVATE];
        const lastDefinition = notifications[notifications.length - 1];

        if (lastDefinition && lastDefinition.isSingleNotificationMap) {
            // reuse the latest definition
            let list = lastDefinition.map.get(name);

            if (!list) {
                list = [];
                lastDefinition.map.set(name, list);
            }

            list.push(func);
        }
        else {
            notifications.push({
                isSingleNotificationMap: true,
                map: new Map([[name, [func]]]),
                object: null,
            });
        }
    }

    /**
     * Registers multiple notifications using an object or Map.
     *
     * A notification is a method for which the return value or thrown Error is ignored. A response object is never sent.
     *
     * If the same method name is registered multiple times, all functions handlers will be called (in the same order as they were
     * registered)
     *
     * Each key->value pair is registered as a notification.
     * Values that are not a "function" are ignored.
     * The `this` object during a method call is set to the `objectOrMap` (unless a Map was used)
     *
     * If the same method name is registered multiple times, earlier definitions will be overridden
     *
     * @param {Object|Map} objectOrMap
     */
    notifications(objectOrMap) {
        if (!objectOrMap || typeof objectOrMap !== 'object') {
            throw Error('First argument (objectOrMap) must be an object, or a Map');
        }

        const {notifications} = this[PRIVATE];

        if (getObjectTag(objectOrMap) === '[object Map]') {
            notifications.push({
                isSingleNotificationMap: false,
                map: objectOrMap,
                object: null,
            });
        }
        else {
            notifications.push({
                isSingleNotificationMap: false,
                map: null,
                object: objectOrMap,
            });
        }
    }

    /**
     * Directly call a method registered on this instance, without involving any stream.
     *
     * This is mostly useful for testing.
     *
     * @private
     * @param {string} name The method name
     * @param {...*} args
     * @return {Promise} A promise resolving with the return value of the method, or rejecting with an error
     */
    callLocal(name, ...args) {
        return prom(Promise.resolve().then(() => {
            ++this[PRIVATE].serverPending;
            const {methods} = this[PRIVATE];

            if (typeof name !== 'string') {
                throw Error('First argument (name) must be a string');
            }

            if (name.startsWith('rpc.')) { // reserved
                throw new RPCRequestError(Error('Method not found'), -32601);
            }

            for (let i = methods.length - 1; i >= 0; --i) {
                const {map, object} = methods[i];

                if (map) {
                    const method = map.get(name);

                    if (typeof method !== 'function') {
                        continue;
                    }

                    return method(...args);
                }

                const method = object[name];

                if (typeof method !== 'function' || JSONBird.isObjectBuiltinFunction(object, name)) {
                    continue;
                }

                return method.apply(object, args);
            }

            throw new RPCRequestError(Error('Method not found'), -32601);
        }))
        .finally(() => {
            --this[PRIVATE].serverPending;
        });
    }

    /**
     * Directly call a method registered on this instance (see callLocal), and send a response object to our readableStream
     *
     * @private
     * @param {number|string} id The id to use in the response object
     * @param {string} name The method name
     * @param {...*} args
     * @return {*} The return value of the method
     */
    callLocalAndSendResponse(id, name, ...args) {
        if (!JSONBird.isValidID(id)) {
            return Promise.reject(Error('First argument is not a valid id'));
        }

        const returnPromise = this.callLocal(name, ...args)
        .then(
            result => ({
                jsonrpc: '2.0',
                id,
                result: result === undefined ? null : result, // JSON.stringify({result: undefined}) === '{}'
            }),
            error => ({
                jsonrpc: '2.0',
                id,
                error: JSONBird.errorToResponseObject(error, this.sendErrorStack),
            })
        )
        .then(object => this.sendObject(object));

        // pendingResponsesPromise resolves after all out going objects have been buffered into our read stream
        // this includes waiting for any pending method calls (if we are acting as a server) to resolve to a value
        // pendingResponsesPromise always resolves to undefined, and it never rejects.
        // this needed so that if our write stream is closed, we do not close our read stream too early
        this[PRIVATE].pendingResponsesPromise = this[PRIVATE].pendingResponsesPromise.then(
            () => returnPromise.then(NOOP, NOOP)
        );

        return returnPromise;
    }

    /**
     * Call a method on the remote instance, by sending a JSON-RPC request object to our write stream.
     *
     * If no write stream has been set, the method call will be buffered until a write stream is set (setWriteStream).
     * Note: if a read stream is never set, any call() will also never resolve.
     *
     * @param {string|Object} nameOrOptions The method name or an options object
     * @param {string} nameOrOptions.name The method name
     * @param {number} nameOrOptions.timeout A maximum time (in milliseconds) to wait for a response. The returned promise will reject
     * after this time.
     * @param {...*} args
     *
     * @return {Promise} A Promise which will resole with the return value of the remote method
     */
    call(nameOrOptions, ...args) {
        const {clientPendingMap} = this[PRIVATE];

        if ((typeof nameOrOptions !== 'string' && typeof nameOrOptions !== 'object') || nameOrOptions === null) {
            return Promise.reject(new Error('First argument must be a string or an object with at least a "name" property'));
        }

        const name = typeof nameOrOptions === 'object' ? nameOrOptions.name : nameOrOptions;

        if (typeof name !== 'string') {
            return Promise.reject(new Error('First argument must be a string or an object with at least a "name" property'));
        }

        const timeout = typeof nameOrOptions === 'object' && 'timeout' in nameOrOptions
            ? nameOrOptions.timeout :
            this.defaultTimeout;

        if (this.finished) {
            // note: notify() does have this check because it does not care about response objects
            return Promise.reject(new Error(
                'The Writable side of this Duplex stream has finished, we will be unable to receive a response object for this call'
            ));
        }

        const id = this.generateId();

        /* istanbul ignore if */
        if (clientPendingMap.has(id)) {
            return Promise.reject(new RPCRequestError(Error('Generated request "id" is not unique!'), -32603));
        }

        let pendingData;

        const responsePromise = new Promise((resolve, reject) => {
            const timer = timeout && this.setTimeout(
                () => {
                    pendingData.timer = 0;
                    reject(new RPCRequestError(Error(`Remote Call timed out after ${timeout}ms`), -32000));
                },
                timeout
            );
            pendingData = {resolve, reject, timer};
        });

        clientPendingMap.set(id, pendingData);

        const returnPromise = prom(this.sendObject({
            jsonrpc: '2.0',
            id,
            method: name,
            params: args,
        })
        .then(() => responsePromise))
        .finally(() => {
            clientPendingMap.delete(id);

            if (pendingData.timer) {
                this.clearTimeout(pendingData.timer);
            }
        });

        this[PRIVATE].pendingRequestPromise = this[PRIVATE].pendingRequestPromise.then(
            () => returnPromise.then(NOOP, NOOP)
        );

        return returnPromise;
    }

    /**
     * Returns a new function which calls the given method name by binding the function to this RPC instance and the given method name (or
     * options object).
     *
     * For example:
     *
     * ```javascript
     * const subtract = rpc.bindCall('subtract');
     * subtract(10, 3).then(result => console.log(result)) // 7
     * ```
     *
     * @param {string|Object} nameOrOptions The method name or an options object
     * @param {string} nameOrOptions.name The method name
     * @param {number} nameOrOptions.timeout A maximum time (in milliseconds) to wait for a response. The returned promise will reject
     *                 after this time.
     * @return {Function}
     */
    bindCall(nameOrOptions) {
        return this.call.bind(this, nameOrOptions);
    }

    /**
     * Directly call a notification registered on this instance, without involving any stream.
     *
     * This function resolves as soon as all invocation for the appropriate registered notifications have been scheduled, but before
     * actually invoking any of them.
     *
     * This is mostly useful for testing.
     *
     * @private
     * @param {string} name The method name
     * @param {...*} args
     * @return {Promise} A promise resolving with `undefined` and only rejects when an internal JSONBird Error occurs.
     */
    notifyLocal(name, ...args) {
        return Promise.resolve().then(() => {
            if (typeof name !== 'string') {
                throw Error('First argument (name) must be a string');
            }

            if (name.startsWith('rpc.')) { // reserved
                return;
            }

            const {notifications} = this[PRIVATE];

            const executeMethod = (thisObject, method) => {
                Promise.resolve().then(() => method.apply(thisObject, args)).catch(error => this.emit('error', error));
            };

            for (let i = notifications.length - 1; i >= 0; --i) {
                const {map, object} = notifications[i];

                if (map) {
                    const mapValue = map.get(name);
                    const methods = Array.isArray(mapValue) ? mapValue : [mapValue];

                    // eslint-disable-next-line prefer-const
                    for (let method of methods) {
                        if (typeof method === 'function') {
                            executeMethod(undefined, method);
                        }
                    }
                }
                else {
                    const method = object[name];

                    if (typeof method !== 'function' || JSONBird.isObjectBuiltinFunction(object, name)) {
                        continue;
                    }

                    executeMethod(object, method);
                }
            }
        });
    }

    /**
     * Execute a notification on the remote instance, by sending a JSON-RPC request object to our write stream.
     *
     * If no write stream has been set, the method call will be buffered until a write stream is set (setWriteStream).
     *
     * This function resolves as soon as the request object has been buffered, but does not wait for the remote instance to have
     * actually received the request object.
     *
     * @param {string|Object} nameOrOptions The method name or an options object
     * @param {string} nameOrOptions.name The method name
     * @param {...*} args
     *
     * @return {Promise}
     */
    notify(nameOrOptions, ...args) {
        if ((typeof nameOrOptions !== 'string' && typeof nameOrOptions !== 'object') || nameOrOptions === null) {
            return Promise.reject(new Error('First argument must be a string or an object with at least a "name" property'));
        }

        const name = typeof nameOrOptions === 'object' ? nameOrOptions.name : nameOrOptions;

        if (typeof name !== 'string') {
            return Promise.reject(new Error('First argument must be a string or an object with at least a "name" property'));
        }

        return this.sendObject({
            jsonrpc: '2.0',
            method: name,
            params: args,
        });
    }

    /**
     * Returns a new function which sends a notification with the given method name by binding the function to this RPC instance and the
     * given method name (or options object).
     *
     * For example:
     *
     * ```javascript
     * const userDeleted = rpc.bindNotify('userDeleted');
     * userDeleted(123)
     * ```
     *
     * @param {string|Object} nameOrOptions The method name or an options object
     * @param {string} nameOrOptions.name The method name
     * @param {number} nameOrOptions.timeout A maximum time (in milliseconds) to wait for a response. The returned promise will reject
     *                 after this time.
     * @return {Function}
     */
    bindNotify(nameOrOptions) {
        return this.notify.bind(this, nameOrOptions);
    }

    _read(size) {
        // noop
    }

    _write(chunk, encoding, callback) {
        const handleRpcError = error => {
            if (error instanceof RPCRequestError) {
                return this.sendObject({
                    jsonrpc: '2.0',
                    error: JSONBird.errorToResponseObject(error),
                    id: error[REQUEST_ERROR_ID] || null,
                })
                .then(() => {
                    this.emit('protocolError', error);
                });
            }

            /* istanbul ignore else */
            if (error instanceof RPCResponseError) {
                this.emit('protocolError', error);

                return null;
            }

            /* istanbul ignore next */
            throw error;
        };

        Promise.resolve().then(() => {
            if (this.writableMode === 'object') {
                /* istanbul ignore if */
                if (typeof chunk !== 'object' || Buffer.isBuffer(chunk)) {
                    throw Error(`Assertion Error: expected an object during _write()`);
                }

                return this.handleObject(chunk).catch(handleRpcError);
            }

            if (this.writableMode === 'json-message') {
                /* istanbul ignore if */
                if (typeof chunk !== 'string' && !Buffer.isBuffer(chunk)) {
                    throw Error(`Assertion Error: expected a string or Buffer during _write()`);
                }

                const jsonString = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : chunk;
                let object;

                try {
                    object = JSON.parse(jsonString); // might throw
                }
                catch (err) {
                    // We can not know for certain that this was a request object because JSONBird might be used bidirectionally.
                    // So assume this is a request object, not sending a response at all is worse than sending too much.
                    return Promise.reject(new RPCRequestError(
                        Error(`Error parsing your JSON string: ${err.message}`),
                        -32700
                    ))
                    .catch(handleRpcError);
                }

                return this.handleObject(object).catch(handleRpcError);
            }

            /* istanbul ignore else */
            if (this.writableMode === 'json-stream') {
                const {readJSONParser, readJSONParserValues} = this[PRIVATE];

                /* istanbul ignore if */
                if (typeof chunk !== 'string' && !Buffer.isBuffer(chunk)) {
                    throw Error(`Assertion Error: expected a string or Buffer during _write()`);
                }

                try {
                    // accepts a Buffer or a string
                    // note: writeJSONParser is not a stream, everything is parsed synchronously,
                    // "onValue" is also called synchronously
                    readJSONParser.write(chunk);
                }
                catch (err) {
                    // We can not know for certain that this was a request object because JSONBird might be used bidirectionally.
                    // So assume this is a request object, not sending a response at all is worse than sending too much.
                    return Promise.reject(new RPCRequestError(
                        Error(`Error parsing your JSON string: ${err.message}`),
                        -32700
                    ))
                    .catch(handleRpcError);
                }

                const promises = readJSONParserValues.map(object =>
                    this.handleObject(object).catch(handleRpcError)
                );
                readJSONParserValues.length = 0;

                return Promise.all(promises);
            }

            /* istanbul ignore next */
            throw Error(`Assertion Error: Invalid this.readableMode during _write(): ${this.readableMode}`);
        })
        // callback(error) is emitted as an 'error' on this stream (and also interrupts the stream)
        .then(
            () => callback(),
            error => {
                /* istanbul ignore next */
                callback(error);
            }
        );
    }

    /**
     * Immediately handle the given request or response object, without buffering.
     *
     * This function waits until all the sanity checks have been performed, however it does not wait for the method handler (the
     * function registered using `method()` or `notification()`)
     *
     * @private
     * @param {Object} object plain old javascript options
     * @return {Promise} Resolves with `undefined` or it rejects with a `RPCRequestError` or `RPCResponseError` if the object is malformed
     */
    handleObject(object) {
        if ('method' in object) {
            return this.handleRequestObject(object);
        }

        if ('result' in object || 'error' in object) {
            return this.handleResponseObject(object);
        }

        // We can not know for certain that this was a request object because JSONBird is (optionally) bidirectional.
        // So assume this is a request object, not sending a response at all is worse than sending too much.
        return Promise.reject(new RPCRequestError(
            Error('Unable to determine if the message was a request or response object (one of the "method", "result"' +
            ' or "error" properties must be present)'),
            -32600
        ));
    }

    /**
     * Immediately handle the given request object, without buffering.
     *
     * This function waits until all the sanity checks have been performed, however it does not wait for the method handler (the
     * function registered using `method()` or `notification()`)
     *
     * @private
     * @param {Object} object plain old javascript options
     * @return {Promise} Resolves with `undefined` or it rejects with a `RPCRequestError` if the object is malformed
     */
    handleRequestObject(object) {
        let id = null;

        return Promise.resolve().then(() => {
            if (JSONBird.isValidID(object.id)) {
                id = object.id;
            }

            if (!('jsonrpc' in object)) {
                throw new RPCRequestError(Error(
                    'Invalid Request: "jsonrpc" attribute is missing (JSON-RPC version 1 is not supported)'
                ), -32600);
            }

            if (!JSONBird.isValidVersion(object.jsonrpc)) {
                throw new RPCRequestError(Error('Invalid Request: given "jsonrpc" version is not supported'), -32600);
            }

            if (!JSONBird.isValidMethodName(object.method)) {
                throw new RPCRequestError(Error('Method not found: "method" attribute must be a string'), -32601);
            }

            let params = [];

            if ('params' in object) {
                if (JSONBird.isValidParams(object.params)) {
                    params = Array.isArray(object.params)
                        ? object.params
                        : [object.params];
                }
                else {
                    throw new RPCRequestError(Error('Invalid Request: "params" must be an array or object'), -32600);
                }
            }

            if ('id' in object) {
                if (id === null) {
                    throw new RPCRequestError(Error('Invalid Request: "id" must be a number or a string'), -32600);
                }

                // We do not wait for this method to complete, otherwise we could only execute a single method at a time because we are
                // currently blocking the stream
                this.callLocalAndSendResponse(id, object.method, ...params);
            }
            else {
                this.notifyLocal(object.method, ...params);
            }
        })
        .catch(error => {
            error[REQUEST_ERROR_ID] = id;
            throw error;
        });
    }

    /**
     * Immediately handle the given response object, without buffering.
     *
     * This function waits until all the sanity checks have been performed
     *
     * @private
     * @param {Object} object plain old javascript options
     * @return {Promise} Resolves with `undefined` or it rejects with a `RPCResponseError` if the object is malformed
     */
    handleResponseObject(object) {
        return Promise.resolve().then(() => {
            if (!JSONBird.isValidVersion(object.jsonrpc)) {
                // emitted as an 'error' event
                throw new RPCResponseError(Error('Invalid Response: "jsonrpc" property must be "2.0"'));
            }

            if (!JSONBird.isValidID(object.id)) {
                throw new RPCResponseError(Error('Invalid Response: "id" property must be a number or string'));
            }

            if (!('result' in object || typeof object.error === 'object')) {
                throw new RPCResponseError(Error('Invalid Response: Must have a "error" or an "result" property'));
            }

            if ('result' in object && 'error' in object) {
                throw new RPCResponseError(Error('Invalid Response: The "error" and "result" properties are both present'));
            }

            const {clientPendingMap} = this[PRIVATE];
            const pendingEntry = clientPendingMap.get(object.id);

            if (!pendingEntry) {
                throw new RPCResponseError(Error('Invalid Response: Unknown id'));
            }

            if ('result' in object) {
                pendingEntry.resolve(object.result);
            }
            else /* if ('error' in object) */ {
                const error = new RPCRequestError(Error(object.error.message), object.error.code, object.error.data);

                if (this.receiveErrorStack && object.error.data && object.error.data.isJSError === true) {
                    error.parseDataAsRemoteStack();
                }

                pendingEntry.reject(error);
            }
        });
    }

    /**
     * Buffer the given object to the Readable side of this Duplex stream.
     *
     * No sanity checks are performed for the `object`. However this function might reject if readableMode is 'json-stream' and the `object`
     * can not be properly converted to JSON.
     *
     * @private
     * @param {Object} object
     * @return {Promise}
     */
    sendObject(object) {
        if (this.ended) {
            return Promise.reject(new Error('The Readable side of this Duplex stream has ended, unable to send any request objects'));
        }

        return Promise.resolve().then(() => {
            /* istanbul ignore else */
            if (this.readableMode === 'object') {
                this.push(object);
            }
            else if (this.readableMode === 'json-message') {
                this.push(JSON.stringify(object));
            }
            else if (this.readableMode === 'json-stream') {
                this.push(JSON.stringify(object));

                if (this.endOfJSONWhitespace) {
                    this.push(this.endOfJSONWhitespace);
                }
            }
            else {
                throw Error(`Assertion Error: Invalid this.readableMode during sendObject(): ${this.readableMode}`);
            }
        });
    }

    /**
     * Start pinging our peer periodically.
     *
     * A ping is a remote method call with the name `this.pingMethod`. This method is called every `this.pingInterval`,
     * with a timeout of `this.pingTimeout`. The events 'pingSuccess' and 'pingFail' are emitted based on the results
     * of the call. The property `this.isSendingPings` can be read to find out if pings are currently being sent.
     *
     * When you are done, make sure to either call stopPinging() or end/finish this stream if pinging is enabled,
     * otherwise you will leak resources.
     */
    startPinging() {
        if (this.ended || this.finished) {
            throw Error('startPinging(): This stream has been ended or finished');
        }

        // never run >1 timers at once
        this.stopPinging();

        this[PRIVATE].isSendingPings = true;

        this[PRIVATE].pingTimer = this.setTimeout(() => {
            this[PRIVATE].pingTimer = 0;

            const {pingNow} = this[PRIVATE];
            const begin = pingNow(); // note: do not set `this`

            this.call({
                name: this.pingMethod,
                timeout: this.pingTimeout,
            }).then(
                () => {
                    const end = pingNow();
                    this[PRIVATE].pingConsecutiveFails = 0;

                    try {
                        this.emit('pingSuccess', end - begin);
                    }
                    finally {
                        if (this.isSendingPings) {
                            this.startPinging();
                        }
                    }
                },
                error => {
                    ++this[PRIVATE].pingConsecutiveFails;

                    try {
                        this.emit('pingFail', this[PRIVATE].pingConsecutiveFails, error);
                    }
                    finally {
                        if (this.isSendingPings) {
                            this.startPinging();
                        }
                    }
                });

        }, this.pingInterval);
    }

    /**
     * Stop the periodic ping (if previously enabled by `startPinging()`).
     */
    stopPinging() {
        const {pingTimer} = this[PRIVATE];

        if (pingTimer) {
            this.clearTimeout(pingTimer);
            this[PRIVATE].pingTimer = 0;
        }

        this[PRIVATE].isSendingPings = false;
    }

    /**
     * Resets all statistics which are reported by ping events.
     *
     * Currently this method only sets `pingConsecutiveFails` to 1 for the next `pingFail` event
     */
    resetPingStatistics() {
        this[PRIVATE].pingConsecutiveFails = 0;
    }
}

JSONBird.RPCRequestError = RPCRequestError;
JSONBird.RPCResponseError = RPCResponseError;

module.exports = JSONBird;
