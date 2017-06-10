'use strict';

const path = require('path');

module.exports = config => {
        config.set({
                basePath: path.resolve(__dirname, '..'),
                frameworks: ['mocha-webworker'],

                files: [
                        {pattern: 'test/mocha/simple.js', included: false},
                        {pattern: 'test/mocha/assert-type-dedicated.js', included: false},
                ],

                reporters: ['progress'],
                port: 9876,
                colors: true,
                logLevel: config.LOG_DEBUG,

                browsers: ['Firefox', 'Chrome'],
                singleRun: true,
        });
};
