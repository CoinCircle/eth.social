'use strict';

function RPCError(wrapped) {
    // Wrap the Error so that the stack, lineNumber, fileName, etc is correct
    this.wrapped = wrapped;
    this.wrapped.name = 'Throwable';

    /* istanbul ignore if */
    if (typeof wrapped !== 'object') {
        throw Error('RPCError should wrap an Error');
    }
}

RPCError.prototype = Object.create(Error.prototype);
RPCError.prototype.constructor = RPCError;

Object.defineProperties(RPCError.prototype, {
    name: {
        configurable: true,
        enumerable: false,
        get() {
            return this.wrapped.name;
        },
        set(value) {
            this.wrapped.name = value;
        },
    },
    message: {
        configurable: true,
        enumerable: false,
        get() {
            return this.wrapped.message;
        },
        set(value) {
            this.wrapped.message = value;
        },
    },
    stack: {
        configurable: true,
        enumerable: false,
        get() {
            return this.wrapped.stack;
        },
        set(value) {
            this.wrapped.stack = value;
        },
    },
    fileName: {
        configurable: true,
        enumerable: false,
        get() {
            return this.wrapped.fileName;
        },
        set(value) {
            this.wrapped.fileName = value;
        },
    },
    lineNumber: {
        configurable: true,
        enumerable: false,
        get() {
            return this.wrapped.lineNumber;
        },
        set(value) {
            this.wrapped.lineNumber = value;
        },
    },
    columnNumber: {
        configurable: true,
        enumerable: false,
        get() {
            return this.wrapped.columnNumber;
        },
        set(value) {
            this.wrapped.columnNumber = value;
        },
    },
});

RPCError.prototype.toString = function() {
    return this.wrapped.toString();
};

module.exports = RPCError;
