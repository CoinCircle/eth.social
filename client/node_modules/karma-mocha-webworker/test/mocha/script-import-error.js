'use strict';

function throwMeAnError() {
        if (10 > 3) {
                throw Error('This error is on purpose! You can find me at: script-import-error.js on line 5 (called by line 10)...');
        }
}

if ('foo' !== 'bar') {
        throwMeAnError();
}
