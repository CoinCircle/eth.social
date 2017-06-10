/* globals describe, it, self */
'use strict';

describe('karma-mocha-webworker', () => {
        it('should run within a shared worker', () => {
                if (!(self.SharedWorkerGlobalScope && self instanceof self.SharedWorkerGlobalScope)) {
                        throw Error('Expected to run within a shared worker');
                }
        });
});
