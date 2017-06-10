'use strict';

const JSONBird = require('jsonbird');

const common = require('./common');

const context = global;

context.onconnect = function (e) {
        const port = e.ports[0];
        const rpc = new JSONBird({
                readableMode: 'object',
                writableMode: 'object',
                receiveErrorStack: true,
                sendErrorStack: true,
        });

        port.onmessage = e => rpc.write(e.data);
        rpc.on('error', error => console.error('[karma-mocha-webworker SharedWorker] Error during RPC', error, error.stack));
        rpc.on('data', object => port.postMessage(object));

        common.defineRPCMethods(rpc, context, 'SharedWorker');

        // a little hack to make mocha function in a worker context
        context.window = context; // ( deleted in initializeMocha() )

        rpc.notify('ready');
};
