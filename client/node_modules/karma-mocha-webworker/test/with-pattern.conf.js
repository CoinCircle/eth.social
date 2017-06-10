'use strict';

const path = require('path');

module.exports = config => {
        config.set({
                basePath: path.resolve(__dirname, '..'),
                frameworks: ['mocha-webworker'],

                files: [
                        {pattern: 'test/mocha/simple.js', included: false},
                        {pattern: 'test/mocha/filter-me.js', included: false},
                ],

                client: {
                        mochaWebWorker: {
                                pattern: 'test/*/simple.js',
                        },
                },

                reporters: ['progress'],
                port: 9876,
                colors: true,
                logLevel: config.LOG_DEBUG,

                browsers: ['Firefox', 'Chrome'],
                singleRun: true,
        });
};
