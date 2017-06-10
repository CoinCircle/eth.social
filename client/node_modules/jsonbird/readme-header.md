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
