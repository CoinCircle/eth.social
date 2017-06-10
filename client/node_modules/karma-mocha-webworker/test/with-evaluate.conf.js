'use strict';

const path = require('path');

module.exports = config => {
        config.set({
                basePath: path.resolve(__dirname, '..'),
                frameworks: ['mocha-webworker'],

                files: [
                        {pattern: 'test/mocha/evaluate-stages.js', included: false},
                ],

                client: {
                        mochaWebWorker: {
                                evaluate: {
                                        beforeMochaImport: `
                                                self.console.log("Before the mocha script is imported");
                                                self.testBeforeMochaImport = true;
                                        `,
                                        beforeMochaSetup: `
                                                self.console.log("Before mocha is setup");
                                                self.testBeforeMochaSetup = true;
                                        `,
                                        beforeScripts: `
                                                self.console.log("Before your scripts are imported");
                                                self.testBeforeScripts = true;
                                        `,
                                        beforeRun: `
                                                self.console.log("Before your tests are run");
                                                self.testBeforeRun = true;
                                        `,
                                        afterRun: `
                                                self.console.log("After your tests have been run");
                                                self.testAfterRun = true;
                                        `,
                                },
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
