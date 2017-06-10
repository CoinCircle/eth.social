/* globals describe, it */
'use strict';

describe('karma-mocha-webworker', () => {
        it('should succeed', () => {
                console.log('Executed "should succeed"');
        });

        it('should fail', () => {
                throw Error('should fail');
        });

        it.skip('should be skipped', () => {
                throw Error('should have been skipped');
        });

        it('should be skipped', function() {
                this.skip();
                throw Error('should have been skipped');
        });

        it('there should be no global `window` object during tests', () => {
                if (typeof window !== 'undefined') {
                        throw Error('window should be undefined');
                }
        });
});
