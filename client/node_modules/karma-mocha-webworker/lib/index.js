'use strict';

const path = require('path');

function initMochaWebWorker(files) {

        files.unshift({
                pattern: path.resolve(__dirname, '..', 'karma-mocha-webworker-client', 'adapter.js'),
                included: true,
                served: true,
                watched: false,
        });

        files.unshift({
                pattern: path.resolve(__dirname, '..', 'karma-mocha-webworker-client', 'worker.js'),
                included: false,
                served: true,
                watched: false,
        });

        files.unshift({
                pattern: path.resolve(__dirname, '..', 'karma-mocha-webworker-client', 'shared-worker.js'),
                included: false,
                served: true,
                watched: false,
        });

        files.unshift({
                pattern: require.resolve('mocha/mocha'),
                included: false,
                served: true,
                watched: false,
        });
}

initMochaWebWorker.$inject = ['config.files'];

exports['framework:mocha-webworker'] = ['factory', initMochaWebWorker];
