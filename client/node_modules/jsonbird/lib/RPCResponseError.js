'use strict';

const RPCError = require('./RPCError');


class RPCResponseError extends RPCError {
    constructor(wrapped) {
        super(wrapped);
        this.name = 'RPCResponseError';
    }
}

module.exports = RPCResponseError;
