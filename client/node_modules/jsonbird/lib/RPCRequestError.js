'use strict';

const RPCError = require('./RPCError');

class RPCRequestError extends RPCError {
    static defaultErrorMessage(code) {
        if (code === -32700) {
            return 'Parse error';
        }

        if (code === -32600) {
            return 'Invalid Request';
        }

        if (code === -32601) {
            return 'Method not found';
        }

        if (code === -32602) {
            return 'Invalid params';
        }

        if (code === -32603) {
            return 'Internal error';
        }

        if (code === -32000) { // JSONBird specific
            return 'Remote Call timed out';
        }

        if (code >= -32099 && code <= -32000) {
            return 'Server error';
        }

        return '';
    }

    constructor(wrapped, codeArg = 0, data = undefined) {
        super(wrapped);

        const code = Number(codeArg) || 0;

        if (!this.message) {
            this.message = RPCRequestError.defaultErrorMessage(code);
        }

        this.name = 'RPCRequestError';
        this.code = code;
        this.data = data;
    }

    parseDataAsRemoteStack() {
        const data = this.data || {};
        this.name = 'RPCRequestError<' + data.name + '>';
        this.localStack = this.stack;
        this.remoteStack = String(data.stack);
        this.fileName = String(data.fileName);
        this.lineNumber = Number(data.lineNumber);
        this.columnNumber = Number(data.columnNumber);
        this.stack = this.localStack + '\n' + 'Caused by Remote ' + this.remoteStack;
    }
}

module.exports = RPCRequestError;
