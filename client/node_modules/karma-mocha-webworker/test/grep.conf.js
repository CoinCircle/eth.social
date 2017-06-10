'use strict';

const path = require('path');

module.exports = config => {
        config.set({
                basePath: path.resolve(__dirname, '..'),
                frameworks: ['mocha-webworker'],

                files: [
                        {pattern: 'test/mocha/fail-and-skip.js', included: false},
                ],

                client: {
                        args: ['--grep', 'should succeed'],
                },

                reporters: ['progress'],
                port: 9876,
                colors: true,
                logLevel: config.LOG_DEBUG,

                browsers: ['Firefox', 'Chrome'],
                singleRun: true,
        });
};
