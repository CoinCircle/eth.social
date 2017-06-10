/* globals describe, it, self */
'use strict';

describe('karma-mocha-webworker', () => {
        it('should run within a dedicated worker', () => {
                if (!(self.DedicatedWorkerGlobalScope && self instanceof self.DedicatedWorkerGlobalScope)) {
                        throw Error('Expected to run within a dedicated worker');
                }
        });
});
