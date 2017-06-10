/* globals describe, it, self */
'use strict';

describe('karma-mocha-webworker', () => {
        it('should succeed', () => {
                console.log('Executed "should succeed"');
        });

        it('should have fired the proper evaluate stages', () => {
                if (!self.testBeforeMochaImport) {
                        throw Error('Should have fired beforeMochaImport');
                }

                if (!self.testBeforeMochaSetup) {
                        throw Error('Should have fired beforeMochaSetup');
                }

                if (!self.testBeforeScripts) {
                        throw Error('Should have fired beforeScripts');
                }

                if (!self.testBeforeRun) {
                        throw Error('Should have fired beforeRun');
                }

                if (self.testAfterRun) {
                        throw Error('Should not have fired afterRun yet');
                }
        });
});
