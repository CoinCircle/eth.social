'use strict';

const {assert} = require('chai');

const ANY_VALUE = Symbol('ANY_VALUE');

class PromiseFateTracker {
    constructor() {
        this.fates = new Map();
    }

    track(name, promise) {
        this.fates.set(name, {promise});

        promise.then(
            result => {
                this.fates.set(name, {promise, resolve: result});

                return result;
            },
            error => {
                this.fates.set(name, {promise, reject: error});
            }
        );
    }

    getFate(name) {
        return this.fates.get(name);
    }

    waitForSettled(name) {
        const fate = this.getFate(name);

        return fate.promise.then(() => {}, () => {});
    }

    waitForAllSettled() {
        return Promise.all([...this.fates.keys()].map(name => this.waitForSettled(name)));
    }

    assertPending(name) {
        const fate = this.getFate(name);
        assert(!fate.resolve && !fate.reject, `The tracked promise "${name}" should be pending`);
    }

    assertResolved(name, expectedValue = ANY_VALUE) {
        const fate = this.getFate(name);
        assert(fate, `There should be a promise tracked with name "${name}"`);
        assert('resolve' in fate, `The tracked promise "${name}" should be resolved`);

        if (expectedValue !== ANY_VALUE) {
            assert.deepEqual(fate.resolve, expectedValue, 'The tracked promise "${name}" should be resolved with the expectedValue');
        }
    }

    assertRejected(name, constructor, regexp) {
        const fate = this.fates.get(name);
        assert(fate, `There should be a promise tracked with name "${name}"`);
        assert('reject' in fate, `The tracked promise "${name}" should be rejected`);

        assert.instanceOf(fate.reject, Error);

        if (constructor) {
            assert.instanceOf(fate.reject, constructor);
        }

        if (regexp) {
            assert.match(fate.reject.message, regexp);
        }
    }
}

module.exports = PromiseFateTracker;
