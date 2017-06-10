'use strict';

const JSONBird = require('jsonbird');

const common = require('./common');

const context = global;
const rpc = new JSONBird({
        readableMode: 'object',
        writableMode: 'object',
        receiveErrorStack: true,
        sendErrorStack: true,
});

context.onmessage = e => rpc.write(e.data);
rpc.on('error', error => console.error('[karma-mocha-webworker Worker] Error during RPC', error, error.stack));
rpc.on('data', object => context.postMessage(object));

common.defineRPCMethods(rpc, context, 'Worker');

// a little hack to make mocha function in a worker context
context.window = context; // ( deleted in initializeMocha() )

rpc.notify('ready');
