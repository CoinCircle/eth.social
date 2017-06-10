'use strict';

const PromiseFinally = function(callback) {
    return this.then(
        value => this.constructor.resolve(callback()).then(() => value),
        reason => this.constructor.resolve(callback()).then(() => {
            throw reason;
        })
    );
};

module.exports = promise => {
    promise.finally = PromiseFinally;

    return promise;
};

