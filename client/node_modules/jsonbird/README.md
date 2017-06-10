# JSONBird
JSONBird is a Duplex stream which makes it easy to create a flexible JSON-RPC 2.0 client or server (or a bidirectional combination) over any reliable transport. You can use out of order messaging or an in-order byte stream.

It can parse/emit JSON strings or parse/emit plain-old-javascript-objects in memory.

JSONBird does not care what transport is used, for example you could use:
* Synchronous HTTP request/responses
* HTTP polling
* WebSocket
* TCP
* SCTP
* postMessage() between a Web Worker or iframe's in a browser (without having to serialize to JSON)
* Direct in-memory communication between two instances (for example, for test stubs)
* Message port's for multiprocess browser extensions

# Examples

## Registering methods

```javascript
const Promise = require('bluebird');
const JSONBird = require('jsonbird');
const rpc = new JSONBird({/*options*/});

class MyMethods {
  add(a, b) {
    return a + b;
  }

  subtract(a, b) {
    return this.add(a, -b);
  }

  slowAdd(a, b) {
    return Promise.delay(100).then(() => this.add(a, b));
  }
}

rpc.methods(new MyMethods());
rpc.method('multiply', (a, b) => a * b);
```

## WebSocket Server (node.js)

```javascript
const JSONBird = require('jsonbird');
const express = require('express');
const {createServer: createWebSocketServer} = require('websocket-stream');

const app = express();
app.get('/', (request, response) => response.end('Hi!'));

const server = app.listen(1234);
const webSocketServer = createWebSocketServer({server}, wsStream => {
  // `rpc` is a node.js duplex stream. The "readable" side refers to the
  // output of JSONBird (you "read" the output from the stream). The
  // "writable" side refers to the input of JSONBird (you "write" the
  // input to the stream):

  const rpc = new JSONBird({
    // The "json-message" readable mode emits JSON documents in object
    // mode, this ensures that our peer never receives a split up json
    // document from us (WebSocket is message based, as opposed to
    // stream based)
    readableMode: 'json-message',

    // The "json-stream" writable mode accepts JSON documents as a
    // string and will reconstruct a split up json document.
    writableMode: 'json-stream',

    // Combining these two modes in this example will maximize
    // compatibility with other JSON-RPC implementations.
  });

  rpc.methods(new MyMethods());

  wsStream.pipe(rpc);
  rpc.pipe(wsStream);
});
```

## WebSocket client (browser)

```javascript
// this example should be bundled using browserify or webpack
const JSONBird = require('jsonbird');
const {WebSocket} = window;

const rpc = new JSONBird({
  readableMode: 'json-message',
  writableMode: 'json-stream',
});

const connect = () => {
  const ws = new WebSocket('ws://localhost:1234/');
  ws.binaryType = 'arraybuffer';

  const rpcOnData = str => ws.send(str);

  ws.onopen = () => {
    rpc.on('data', rpcOnData);

    rpc.call('add', 10, 3)
      .then(result => rpc.call('subtract', result, 1))
      .then(result => console.log('result:', result)) // 12
      ;
  };
  ws.onclose = () => {
    rpc.removeListener('data', rpcOnData);
  };
  ws.onmessage = e => {
    const data = Buffer.from(e.data);
    rpc.write(data);
  };
};

connect();
```

## WebWorker
```javascript
// this example should be bundled using browserify or webpack
const JSONBird = require('jsonbird');
const {WebSocket} = window;
const worker = new Worker('myWorker.js');
const rpc = new JSONBird({
    // take advantage of the structured clone algorithm
    readableMode: 'object',
    writableMode: 'object',
    receiveErrorStack: true,
    sendErrorStack: true,
});
worker.onmessage = e => rpc.write(e.data);
rpc.on('data', object => worker.postMessage(object));
```

__myWorker.js__:
```javascript
// this example should be bundled using browserify or webpack
const JSONBird = require('jsonbird');
const rpc = new JSONBird({
  readableMode: 'object',
  writableMode: 'object',
  receiveErrorStack: true,
  sendErrorStack: true,
});
self.onmessage = e => rpc.write(e.data);
rpc.on('data', object => context.postMessage(object));
```

## Shared WebWorker
```javascript
// this example should be bundled using browserify or webpack
const JSONBird = require('jsonbird');
const {WebSocket} = window;
const worker = new SharedWorker('mySharedWorker.js');
const rpc = new JSONBird({
    // take advantage of the structured clone algorithm
    readableMode: 'object',
    writableMode: 'object',
    receiveErrorStack: true,
    sendErrorStack: true,
});
worker.port.onmessage = e => rpc.write(e.data);
rpc.on('data', object => worker.port.postMessage(object));
```

__mySharedWorker.js__:
```javascript
// this example should be bundled using browserify or webpack
const JSONBird = require('jsonbird');
const rpc = new JSONBird({
  readableMode: 'object',
  writableMode: 'object',
  receiveErrorStack: true,
  sendErrorStack: true,
});
self.onconnect = e => {
    const port = e.ports[0];
    port.onmessage = e => rpc.write(e.data);
    rpc.on('data', object => port.postMessage(object));
};
```

# API Documentation
<a name="JSONBird"></a>

## JSONBird
JSONBird is a Duplex stream which makes it easy to create a flexible JSON-RPC 2.0 client or server (or a bidirectional combination)
over any reliable transport. You can use out of order messaging or an in-order byte stream.

**Kind**: global class  

* [JSONBird](#JSONBird)
    * [new JSONBird([optionsArg])](#new_JSONBird_new)
    * _instance_
        * [.setTimeout](#JSONBird+setTimeout) ⇒ <code>function</code>
        * [.clearTimeout](#JSONBird+clearTimeout) ⇒ <code>function</code>
        * [.ended](#JSONBird+ended) ⇒ <code>boolean</code>
        * [.finished](#JSONBird+finished) ⇒ <code>boolean</code>
        * [.sessionId](#JSONBird+sessionId) ⇒ <code>string</code>
        * [.writableMode](#JSONBird+writableMode) ⇒ <code>string</code>
        * [.readableMode](#JSONBird+readableMode) ⇒ <code>string</code>
        * [.endOfJSONWhitespace](#JSONBird+endOfJSONWhitespace) ⇒ <code>string</code>
        * [.endOnFinish](#JSONBird+endOnFinish) ⇒ <code>boolean</code>
        * [.endOnFinish](#JSONBird+endOnFinish)
        * [.finishOnEnd](#JSONBird+finishOnEnd) ⇒ <code>boolean</code>
        * [.finishOnEnd](#JSONBird+finishOnEnd)
        * [.serverPending](#JSONBird+serverPending) ⇒ <code>number</code>
        * [.clientPending](#JSONBird+clientPending) ⇒ <code>number</code>
        * [.receiveErrorStack](#JSONBird+receiveErrorStack) ⇒ <code>boolean</code>
        * [.receiveErrorStack](#JSONBird+receiveErrorStack)
        * [.sendErrorStack](#JSONBird+sendErrorStack) ⇒ <code>boolean</code>
        * [.sendErrorStack](#JSONBird+sendErrorStack)
        * [.defaultTimeout](#JSONBird+defaultTimeout) ⇒ <code>number</code>
        * [.defaultTimeout](#JSONBird+defaultTimeout)
        * [.pingReceive](#JSONBird+pingReceive) ⇒ <code>boolean</code>
        * [.isSendingPings](#JSONBird+isSendingPings) ⇒ <code>boolean</code>
        * [.pingMethod](#JSONBird+pingMethod) ⇒ <code>string</code>
        * [.pingInterval](#JSONBird+pingInterval) ⇒ <code>number</code>
        * [.pingInterval](#JSONBird+pingInterval)
        * [.pingTimeout](#JSONBird+pingTimeout) ⇒ <code>number</code>
        * [.pingTimeout](#JSONBird+pingTimeout)
        * [.generateId()](#JSONBird+generateId) ⇒ <code>string</code> &#124; <code>number</code>
        * [.waitForPendingResponses()](#JSONBird+waitForPendingResponses) ⇒ <code>Promise</code>
        * [.waitForPendingRequests()](#JSONBird+waitForPendingRequests) ⇒ <code>Promise</code>
        * [.method(name, func)](#JSONBird+method)
        * [.methods(objectOrMap)](#JSONBird+methods)
        * [.notification(name, func)](#JSONBird+notification)
        * [.notifications(objectOrMap)](#JSONBird+notifications)
        * [.call(nameOrOptions, ...args)](#JSONBird+call) ⇒ <code>Promise</code>
        * [.bindCall(nameOrOptions)](#JSONBird+bindCall) ⇒ <code>function</code>
        * [.notify(nameOrOptions, ...args)](#JSONBird+notify) ⇒ <code>Promise</code>
        * [.bindNotify(nameOrOptions)](#JSONBird+bindNotify) ⇒ <code>function</code>
        * [.startPinging()](#JSONBird+startPinging)
        * [.stopPinging()](#JSONBird+stopPinging)
        * [.resetPingStatistics()](#JSONBird+resetPingStatistics)
        * ["error" (error)](#JSONBird+event_error)
        * ["protocolError" (error)](#JSONBird+event_protocolError)
        * ["pingSuccess" (delay)](#JSONBird+event_pingSuccess)
        * ["pingFail" (consecutiveFails, error)](#JSONBird+event_pingFail)
    * _static_
        * [.errorToResponseObject(error, [includeErrorStack])](#JSONBird.errorToResponseObject) ⇒ <code>Object</code>
        * [.isValidVersion(jsonrpc)](#JSONBird.isValidVersion) ⇒ <code>boolean</code>
        * [.isValidID(id)](#JSONBird.isValidID) ⇒ <code>boolean</code>
        * [.isValidMethodName(method)](#JSONBird.isValidMethodName) ⇒ <code>boolean</code>
        * [.isValidParams(params)](#JSONBird.isValidParams) ⇒ <code>boolean</code>
        * [.isObjectBuiltinFunction(object, name)](#JSONBird.isObjectBuiltinFunction) ⇒ <code>boolean</code>

<a name="new_JSONBird_new"></a>

### new JSONBird([optionsArg])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [optionsArg] | <code>Object</code> |  | The effect of these options are documented at the getter/setter with the same name |
| [optionsArg.receiveErrorStack] | <code>boolean</code> | <code>false</code> |  |
| [optionsArg.sendErrorStack] | <code>boolean</code> | <code>false</code> |  |
| [optionsArg.writableMode] | <code>string</code> | <code>&quot;json-stream&quot;</code> |  |
| [optionsArg.readableMode] | <code>string</code> | <code>&quot;json-stream&quot;</code> |  |
| [optionsArg.firstRequestId] | <code>number</code> | <code>0</code> | The first request id to use |
| [optionsArg.sessionId] | <code>string</code> | <code>&quot;randomString()&quot;</code> |  |
| [optionsArg.endOfJSONWhitespace=] | <code>string</code> |  |  |
| [optionsArg.endOnFinish] | <code>boolean</code> | <code>true</code> |  |
| [optionsArg.finishOnEnd] | <code>boolean</code> | <code>true</code> |  |
| [optionsArg.pingReceive] | <code>boolean</code> | <code>true</code> |  |
| [optionsArg.pingMethod] | <code>string</code> | <code>&quot;&#x27;jsonbird.ping&#x27;&quot;</code> |  |
| [optionsArg.pingInterval] | <code>number</code> | <code>2000</code> |  |
| [optionsArg.pingTimeout] | <code>number</code> | <code>1000</code> |  |
| [optionsArg.pingNow] | <code>number</code> | <code>Date.now</code> | Timer function used to figure out ping delays |
| [optionsArg.setTimeout] | <code>function</code> | <code>global.setTimeout</code> |  |
| [optionsArg.clearTimeout] | <code>function</code> | <code>global.clearTimeout</code> |  |

<a name="JSONBird+setTimeout"></a>

### jsonBird.setTimeout ⇒ <code>function</code>
The HTML setTimeout function

This function may be overridden for unit tests

**Kind**: instance property of <code>[JSONBird](#JSONBird)</code>  
**Returns**: <code>function</code> - https://html.spec.whatwg.org/#dom-settimeout  
<a name="JSONBird+clearTimeout"></a>

### jsonBird.clearTimeout ⇒ <code>function</code>
The HTML clearTimeout function

This function may be overridden for unit tests

**Kind**: instance property of <code>[JSONBird](#JSONBird)</code>  
**Returns**: <code>function</code> - https://html.spec.whatwg.org/#dom-cleartimeout  
<a name="JSONBird+ended"></a>

### jsonBird.ended ⇒ <code>boolean</code>
Has the readable side of this duplex stream been ended?

(has the 'end' event been emitted)

**Kind**: instance property of <code>[JSONBird](#JSONBird)</code>  
<a name="JSONBird+finished"></a>

### jsonBird.finished ⇒ <code>boolean</code>
Has the writable side of this duplex stream been finished?

(has the 'finish' event been emitted)

**Kind**: instance property of <code>[JSONBird](#JSONBird)</code>  
<a name="JSONBird+sessionId"></a>

### jsonBird.sessionId ⇒ <code>string</code>
This is a string that will be appended to the id of all request objects that we send out.

This is useful in case the same transport is reused, to make sure that we do not parse any stale response objects.
By default, this is set to a short unique id (using the "shortid" module)

**Kind**: instance property of <code>[JSONBird](#JSONBird)</code>  
<a name="JSONBird+writableMode"></a>

### jsonBird.writableMode ⇒ <code>string</code>
Determines how to JSONBird interprets messages that are written to the writable side of this Duplex stream.

If the value is "object", the writable stream is put in object mode and a plain old javascript object is expected.

For example:
```javascript
rpc.write({jsonrpc: '2.0', method: 'subtract', params: [42, 23], id: 0})
```

If the value is "json-message", the writable stream is put in object mode and a json string or a Buffer (utf8) is expected,

For example:
```javascript
rpc.write('{"jsonrpc":"2.0","method":"subtract","params":[42,23],"id":0}')
rpc.write('{"jsonrpc"') // invalid json string, a `protocolError` event will emitted
```

If the value is "json-stream", a streaming sequence of json strings or Buffers (utf8) are expected.

For example:
```javascript
// will wait until more data arrives to complete the json string:
rpc.write('{"jsonrpc":"2.0","method":"subt')
rpc.write('ract","params":[42,23],"id":0}{"jsonrpc"')
rpc.write(':"2.0","method":"subtract","params":[100,1],"id":1}')
```

**Kind**: instance property of <code>[JSONBird](#JSONBird)</code>  
**Returns**: <code>string</code> - "object", "json-stream" or "json-message"  
<a name="JSONBird+readableMode"></a>

### jsonBird.readableMode ⇒ <code>string</code>
Determines how JSONBird sends messages to the readable side of this Duplex stream.

If the value is "object", the readable stream is put in object mode and a plain old javascript object is sent.

For example:
```javascript
rpc.on('data', object => assert.deepEqual(object, {jsonrpc: '2.0', result: 19, id: 0}));
```

If the value is "json-message", the readable stream is put in object mode and a json string is sent.

For example:
```javascript
rpc.on('data', string => console.log('json string:', string));
// json string: {"jsonrpc":"2.0","result":19,"id":0}
// json string: {"jsonrpc":"2.0","result":99,"id":1}
```

If the value is "json-stream", a streaming sequence of json strings are sent.

For example:
```javascript
rpc.on('data', string => console.log('chunk:', string));
// chunk: {"jsonrpc":"2.0","res
// chunk: ult":19,"id":0}{"jsonrpc":"2.0",
// chunk: "result":99,"id":1}
```

**Kind**: instance property of <code>[JSONBird](#JSONBird)</code>  
**Returns**: <code>string</code> - "object" or "json-stream"  
<a name="JSONBird+endOfJSONWhitespace"></a>

### jsonBird.endOfJSONWhitespace ⇒ <code>string</code>
This value is appended to the end of every json string sent to the readable stream.

Only whitespace characters are allowed. This option only has an affect if `readableMode == 'json-stream'`

**Kind**: instance property of <code>[JSONBird](#JSONBird)</code>  
<a name="JSONBird+endOnFinish"></a>

### jsonBird.endOnFinish ⇒ <code>boolean</code>
If `true` and the writable side of this Duplex stream has finished, automatically end the readable side (after all pending
responses have been sent).

**Kind**: instance property of <code>[JSONBird](#JSONBird)</code>  
<a name="JSONBird+endOnFinish"></a>

### jsonBird.endOnFinish
If `true` and the writable side of this Duplex stream has finished, automatically end the readable side (after all pending
responses have been sent).

**Kind**: instance property of <code>[JSONBird](#JSONBird)</code>  

| Param | Type |
| --- | --- |
| value | <code>boolean</code> | 

<a name="JSONBird+finishOnEnd"></a>

### jsonBird.finishOnEnd ⇒ <code>boolean</code>
If `true` and the readable side of this Duplex stream has ended, automatically finish the writable side (after all pending
requests have received a response).

**Kind**: instance property of <code>[JSONBird](#JSONBird)</code>  
<a name="JSONBird+finishOnEnd"></a>

### jsonBird.finishOnEnd
If `true` and the readable side of this Duplex stream has ended, automatically finish the writable side (after all pending
requests have received a response).

**Kind**: instance property of <code>[JSONBird](#JSONBird)</code>  

| Param | Type |
| --- | --- |
| value | <code>boolean</code> | 

<a name="JSONBird+serverPending"></a>

### jsonBird.serverPending ⇒ <code>number</code>
The number of incoming RPC requests for which we have not sent a reply yet

**Kind**: instance property of <code>[JSONBird](#JSONBird)</code>  
<a name="JSONBird+clientPending"></a>

### jsonBird.clientPending ⇒ <code>number</code>
The number of outstanding RPC requests for which we have not yet received a response.

**Kind**: instance property of <code>[JSONBird](#JSONBird)</code>  
<a name="JSONBird+receiveErrorStack"></a>

### jsonBird.receiveErrorStack ⇒ <code>boolean</code>
If true and a remote method throws, attempt to read stack trace information from the JSON-RPC `error.data` property. This stack
trace information is then used to set the `fileName`, `lineNumber`, `columnNumber` and `stack` properties of our local `Error`
object (the Error object that the `.call()` function will reject with).

**Kind**: instance property of <code>[JSONBird](#JSONBird)</code>  
<a name="JSONBird+receiveErrorStack"></a>

### jsonBird.receiveErrorStack
If true and a remote method throws, attempt to read stack trace information from the JSON-RPC `error.data` property. This stack
trace information is then used to set the `fileName`, `lineNumber`, `columnNumber` and `stack` properties of our local `Error`
object (the Error object that the `.call()` function will reject with).

**Kind**: instance property of <code>[JSONBird](#JSONBird)</code>  

| Param | Type |
| --- | --- |
| value | <code>boolean</code> | 

<a name="JSONBird+sendErrorStack"></a>

### jsonBird.sendErrorStack ⇒ <code>boolean</code>
If true, the `fileName`, `lineNumber`, `columnNumber` and `stack` of an `Error` thrown during a method is sent to the client
using the JSON-RPC `error.data` property.

**Kind**: instance property of <code>[JSONBird](#JSONBird)</code>  
<a name="JSONBird+sendErrorStack"></a>

### jsonBird.sendErrorStack
If true, the `fileName`, `lineNumber`, `columnNumber` and `stack` of an `Error` thrown during a method is sent to the client
using the JSON-RPC `error.data` property.

**Kind**: instance property of <code>[JSONBird](#JSONBird)</code>  

| Param | Type |
| --- | --- |
| value | <code>boolean</code> | 

<a name="JSONBird+defaultTimeout"></a>

### jsonBird.defaultTimeout ⇒ <code>number</code>
The timeout to use for an outgoing method call unless a different timeout was explicitly specified to `call()`.

**Kind**: instance property of <code>[JSONBird](#JSONBird)</code>  
<a name="JSONBird+defaultTimeout"></a>

### jsonBird.defaultTimeout
The timeout to use for an outgoing method call unless a different timeout was explicitly specified to `call()`.

**Kind**: instance property of <code>[JSONBird](#JSONBird)</code>  

| Param | Type |
| --- | --- |
| value | <code>number</code> | 

<a name="JSONBird+pingReceive"></a>

### jsonBird.pingReceive ⇒ <code>boolean</code>
If `true` a method with the name `this.pingMethod` is added which simply returns true as fast as possible.

**Kind**: instance property of <code>[JSONBird](#JSONBird)</code>  
<a name="JSONBird+isSendingPings"></a>

### jsonBird.isSendingPings ⇒ <code>boolean</code>
Are we currently sending pings to our peer?

In other words, has `this.startPinging()` been called?

**Kind**: instance property of <code>[JSONBird](#JSONBird)</code>  
<a name="JSONBird+pingMethod"></a>

### jsonBird.pingMethod ⇒ <code>string</code>
The method name used when receiving or sending pings.

**Kind**: instance property of <code>[JSONBird](#JSONBird)</code>  
<a name="JSONBird+pingInterval"></a>

### jsonBird.pingInterval ⇒ <code>number</code>
The time (in milliseconds) between each ping if `isSendingPings` is true.
This time is in addition to the time spent waiting for the previous ping to settle.

**Kind**: instance property of <code>[JSONBird](#JSONBird)</code>  
**Returns**: <code>number</code> - milliseconds  
<a name="JSONBird+pingInterval"></a>

### jsonBird.pingInterval
The time (in milliseconds) between each ping if `isSendingPings` is true.
This time is in addition to the time spent waiting for the previous ping to settle.

**Kind**: instance property of <code>[JSONBird](#JSONBird)</code>  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>number</code> | milliseconds |

<a name="JSONBird+pingTimeout"></a>

### jsonBird.pingTimeout ⇒ <code>number</code>
The maximum amount of time (in milliseconds) to wait for a ping method call to resolve.

**Kind**: instance property of <code>[JSONBird](#JSONBird)</code>  
**Returns**: <code>number</code> - milliseconds  
<a name="JSONBird+pingTimeout"></a>

### jsonBird.pingTimeout
The maximum amount of time (in milliseconds) to wait for a ping method call to resolve.

**Kind**: instance property of <code>[JSONBird](#JSONBird)</code>  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>number</code> | milliseconds |

<a name="JSONBird+generateId"></a>

### jsonBird.generateId() ⇒ <code>string</code> &#124; <code>number</code>
Generate a new id to be used for an outgoing request object

**Kind**: instance method of <code>[JSONBird](#JSONBird)</code>  
<a name="JSONBird+waitForPendingResponses"></a>

### jsonBird.waitForPendingResponses() ⇒ <code>Promise</code>
Returns a promise which resolves as soon as all pending requests (as a server) have had their appropriate responses sent to the
underlying readable stream.

Note that if a new requests comes in after using waitForPendingResponses(), they will not further delay this Promise.

**Kind**: instance method of <code>[JSONBird](#JSONBird)</code>  
<a name="JSONBird+waitForPendingRequests"></a>

### jsonBird.waitForPendingRequests() ⇒ <code>Promise</code>
Returns a promise which resolves as soon as all pending requests (as a client) have had their appropriate responses received from
the underlying writable stream.

Note that if a new call() is made after using waitForPendingResponses(), it will not further delay this Promise.

**Kind**: instance method of <code>[JSONBird](#JSONBird)</code>  
<a name="JSONBird+method"></a>

### jsonBird.method(name, func)
Registers a new method with the given name.

If the same method name is registered multiple times, earlier definitions will be overridden

**Kind**: instance method of <code>[JSONBird](#JSONBird)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | The method name |
| func | <code>function</code> |  |

<a name="JSONBird+methods"></a>

### jsonBird.methods(objectOrMap)
Registers multiple methods using an object or Map.

Each key->value pair is registered as a method.
Values that are not a function are ignored.
The `this` object during a method call is set to the `objectOrMap` (unless a Map was used)

If the same method name is registered multiple times, earlier definitions will be overridden

**Kind**: instance method of <code>[JSONBird](#JSONBird)</code>  

| Param | Type |
| --- | --- |
| objectOrMap | <code>Object</code> &#124; <code>Map</code> | 

<a name="JSONBird+notification"></a>

### jsonBird.notification(name, func)
Registers a notification with the given name.

A notification is a method for which the return value or thrown Error is ignored. A response object is never sent.

If the same method name is registered multiple times, all functions handlers will be called (in the same order as they were
registered)

**Kind**: instance method of <code>[JSONBird](#JSONBird)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | The method name |
| func | <code>function</code> |  |

<a name="JSONBird+notifications"></a>

### jsonBird.notifications(objectOrMap)
Registers multiple notifications using an object or Map.

A notification is a method for which the return value or thrown Error is ignored. A response object is never sent.

If the same method name is registered multiple times, all functions handlers will be called (in the same order as they were
registered)

Each key->value pair is registered as a notification.
Values that are not a "function" are ignored.
The `this` object during a method call is set to the `objectOrMap` (unless a Map was used)

If the same method name is registered multiple times, earlier definitions will be overridden

**Kind**: instance method of <code>[JSONBird](#JSONBird)</code>  

| Param | Type |
| --- | --- |
| objectOrMap | <code>Object</code> &#124; <code>Map</code> | 

<a name="JSONBird+call"></a>

### jsonBird.call(nameOrOptions, ...args) ⇒ <code>Promise</code>
Call a method on the remote instance, by sending a JSON-RPC request object to our write stream.

If no write stream has been set, the method call will be buffered until a write stream is set (setWriteStream).
Note: if a read stream is never set, any call() will also never resolve.

**Kind**: instance method of <code>[JSONBird](#JSONBird)</code>  
**Returns**: <code>Promise</code> - A Promise which will resole with the return value of the remote method  

| Param | Type | Description |
| --- | --- | --- |
| nameOrOptions | <code>string</code> &#124; <code>Object</code> | The method name or an options object |
| nameOrOptions.name | <code>string</code> | The method name |
| nameOrOptions.timeout | <code>number</code> | A maximum time (in milliseconds) to wait for a response. The returned promise will reject after this time. |
| ...args | <code>\*</code> |  |

<a name="JSONBird+bindCall"></a>

### jsonBird.bindCall(nameOrOptions) ⇒ <code>function</code>
Returns a new function which calls the given method name by binding the function to this RPC instance and the given method name (or
options object).

For example:

```javascript
const subtract = rpc.bindCall('subtract');
subtract(10, 3).then(result => console.log(result)) // 7
```

**Kind**: instance method of <code>[JSONBird](#JSONBird)</code>  

| Param | Type | Description |
| --- | --- | --- |
| nameOrOptions | <code>string</code> &#124; <code>Object</code> | The method name or an options object |
| nameOrOptions.name | <code>string</code> | The method name |
| nameOrOptions.timeout | <code>number</code> | A maximum time (in milliseconds) to wait for a response. The returned promise will reject                 after this time. |

<a name="JSONBird+notify"></a>

### jsonBird.notify(nameOrOptions, ...args) ⇒ <code>Promise</code>
Execute a notification on the remote instance, by sending a JSON-RPC request object to our write stream.

If no write stream has been set, the method call will be buffered until a write stream is set (setWriteStream).

This function resolves as soon as the request object has been buffered, but does not wait for the remote instance to have
actually received the request object.

**Kind**: instance method of <code>[JSONBird](#JSONBird)</code>  

| Param | Type | Description |
| --- | --- | --- |
| nameOrOptions | <code>string</code> &#124; <code>Object</code> | The method name or an options object |
| nameOrOptions.name | <code>string</code> | The method name |
| ...args | <code>\*</code> |  |

<a name="JSONBird+bindNotify"></a>

### jsonBird.bindNotify(nameOrOptions) ⇒ <code>function</code>
Returns a new function which sends a notification with the given method name by binding the function to this RPC instance and the
given method name (or options object).

For example:

```javascript
const userDeleted = rpc.bindNotify('userDeleted');
userDeleted(123)
```

**Kind**: instance method of <code>[JSONBird](#JSONBird)</code>  

| Param | Type | Description |
| --- | --- | --- |
| nameOrOptions | <code>string</code> &#124; <code>Object</code> | The method name or an options object |
| nameOrOptions.name | <code>string</code> | The method name |
| nameOrOptions.timeout | <code>number</code> | A maximum time (in milliseconds) to wait for a response. The returned promise will reject                 after this time. |

<a name="JSONBird+startPinging"></a>

### jsonBird.startPinging()
Start pinging our peer periodically.

A ping is a remote method call with the name `this.pingMethod`. This method is called every `this.pingInterval`,
with a timeout of `this.pingTimeout`. The events 'pingSuccess' and 'pingFail' are emitted based on the results
of the call. The property `this.isSendingPings` can be read to find out if pings are currently being sent.

When you are done, make sure to either call stopPinging() or end/finish this stream if pinging is enabled,
otherwise you will leak resources.

**Kind**: instance method of <code>[JSONBird](#JSONBird)</code>  
<a name="JSONBird+stopPinging"></a>

### jsonBird.stopPinging()
Stop the periodic ping (if previously enabled by `startPinging()`).

**Kind**: instance method of <code>[JSONBird](#JSONBird)</code>  
<a name="JSONBird+resetPingStatistics"></a>

### jsonBird.resetPingStatistics()
Resets all statistics which are reported by ping events.

Currently this method only sets `pingConsecutiveFails` to 1 for the next `pingFail` event

**Kind**: instance method of <code>[JSONBird](#JSONBird)</code>  
<a name="JSONBird+event_error"></a>

### "error" (error)
This event is fired if an uncaught error occurred

Most errors end up at the caller of our functions or at the remote peer, instead of this event.
Note that if you do not listen for this event on node.js, your process might exit.

**Kind**: event emitted by <code>[JSONBird](#JSONBird)</code>  

| Param | Type |
| --- | --- |
| error | <code>Error</code> | 

<a name="JSONBird+event_protocolError"></a>

### "protocolError" (error)
This event is fired if our peer sent us something that we were unable to parse.

These kind of errors do not end up at the 'error' event

**Kind**: event emitted by <code>[JSONBird](#JSONBird)</code>  

| Param | Type |
| --- | --- |
| error | <code>Error</code> | 

<a name="JSONBird+event_pingSuccess"></a>

### "pingSuccess" (delay)
The most recent ping sent to our peer succeeded

**Kind**: event emitted by <code>[JSONBird](#JSONBird)</code>  

| Param | Type | Description |
| --- | --- | --- |
| delay | <code>number</code> | How long the ping took to resolve (in milliseconds) |

<a name="JSONBird+event_pingFail"></a>

### "pingFail" (consecutiveFails, error)
The most recent ping sent to our peer timed out or resulted in an error

**Kind**: event emitted by <code>[JSONBird](#JSONBird)</code>  

| Param | Type | Description |
| --- | --- | --- |
| consecutiveFails | <code>number</code> | The amount of consecutive pings that failed |
| error | <code>Error</code> |  |

<a name="JSONBird.errorToResponseObject"></a>

### JSONBird.errorToResponseObject(error, [includeErrorStack]) ⇒ <code>Object</code>
Converts any javascript `Error` object to a JSON-RPC error object

**Kind**: static method of <code>[JSONBird](#JSONBird)</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| error | <code>Error</code> |  | The `message`, `code` and `data` properties of this `error` will be copied over to the resulting object. |
| [includeErrorStack] | <code>boolean</code> | <code>false</code> | If `true` and `error.data` is `undefined`, the resulting `data` property will be an        object containing the `fileName`, `lineNumber`, `columnNumber` and `stack` of the `error` |

<a name="JSONBird.isValidVersion"></a>

### JSONBird.isValidVersion(jsonrpc) ⇒ <code>boolean</code>
Is the given value for the JSON-RPC `jsonrpc` property a value that we recognise?

Currently, only "2.0" is supported

**Kind**: static method of <code>[JSONBird](#JSONBird)</code>  

| Param | Type |
| --- | --- |
| jsonrpc | <code>\*</code> | 

<a name="JSONBird.isValidID"></a>

### JSONBird.isValidID(id) ⇒ <code>boolean</code>
Is the given value for the JSON-RPC `id` property valid?

**Kind**: static method of <code>[JSONBird](#JSONBird)</code>  

| Param | Type |
| --- | --- |
| id | <code>\*</code> | 

<a name="JSONBird.isValidMethodName"></a>

### JSONBird.isValidMethodName(method) ⇒ <code>boolean</code>
Is the given value for the JSON-RPC `method` property valid?

**Kind**: static method of <code>[JSONBird](#JSONBird)</code>  

| Param | Type |
| --- | --- |
| method | <code>\*</code> | 

<a name="JSONBird.isValidParams"></a>

### JSONBird.isValidParams(params) ⇒ <code>boolean</code>
Is the given value for the JSON-RPC `params` property valid?

**Kind**: static method of <code>[JSONBird](#JSONBird)</code>  

| Param | Type |
| --- | --- |
| params | <code>\*</code> | 

<a name="JSONBird.isObjectBuiltinFunction"></a>

### JSONBird.isObjectBuiltinFunction(object, name) ⇒ <code>boolean</code>
Test if the given property `name` of `object` is one of the builtin Object.prototype functions.

Such as: hasOwnProperty, __defineGetter__, etc

**Kind**: static method of <code>[JSONBird](#JSONBird)</code>  

| Param | Type |
| --- | --- |
| object | <code>Object</code> | 
| name | <code>string</code> | 

