'use strict';

const {deepStrictEqual} = require('assert');
const {Server} = require('karma');

const run = (configFile, expectedBrowserResult) => new Promise(resolve => {
        const results = [];
        let browserFailures = 0;

        const done = () => {
                console.log(`[karma-mocha-webworker] [${configFile}] Karma has completed all browser runs`);

                let failures = 0;

                for (const result of results) {
                        try {
                                deepStrictEqual(result.browserResult, expectedBrowserResult);
                        }
                        catch (error) {
                                // continue on with the other tests
                                console.error(`[karma-mocha-webworker] [${configFile}] [${result.browserName}]`, error);
                                ++failures;
                        }
                }

                resolve({results, failures, browserFailures});
        };

        const server = new Server({configFile: require.resolve(configFile)}, done);

        server.on('browser_complete_with_no_more_retries', (completedBrowser) => {
                const browserName = completedBrowser.name;
                console.log(`[karma-mocha-webworker] [${configFile}] Browser "${browserName}" has completed its run`);

                const {lastResult} = completedBrowser;

                results.push({
                        browserName: browserName,
                        browserResult: {
                                success: lastResult.success,
                                failed: lastResult.failed,
                                skipped: lastResult.skipped,
                                total: lastResult.total,
                                error: lastResult.error,
                                disconnected: lastResult.disconnected,
                        },
                });
        });

        server.on('browser_restart_failure', () => {
                ++browserFailures;
        });

        server.on('browser_process_failure', () => {
                ++browserFailures;
        });

        server.start();
});

/**
 *  All test suites
 */
let runs = [
        ['./defaults.conf.js', {success: 2, failed: 0, skipped: 0, total: 2, error: false, disconnected: false}],
        ['./fail-and-skip.conf.js', {success: 2, failed: 1, skipped: 2, total: 5, error: false, disconnected: false}],
        ['./grep.conf.js', {success: 1, failed: 0, skipped: 0, total: 1, error: false, disconnected: false}],
        ['./mocha-options.conf.js', {success: 1, failed: 0, skipped: 0, total: 1, error: false, disconnected: false}],
        ['./with-evaluate.conf.js', {success: 2, failed: 0, skipped: 0, total: 2, error: false, disconnected: false}],
        ['./with-pattern.conf.js', {success: 1, failed: 0, skipped: 0, total: 1, error: false, disconnected: false}],
        ['./script-import-error.conf.js', {success: 0, failed: 0, skipped: 0, total: 0, error: true, disconnected: false}],
        ['./shared-worker.conf.js', {success: 2, failed: 0, skipped: 0, total: 2, error: false, disconnected: false}],
];

/**
 * Filter test suites if process.env.TEST is set
 */
if (process.env.TEST) {
        runs = runs.filter(value => {
                return value[0].match(process.env.TEST);
        });

        if (runs.length === 0) {
                console.error(`[karma-mocha-webworker] No test matched with ${process.env.TEST}`);
                process.exit(1);
        }
}

let totalFailures = 0;
let totalBrowserFailures = 0;

runs.reduce(
        (promise, [configFile, expectedBrowserResult]) => promise
                .then(() => run(configFile, expectedBrowserResult).then(result => {
                        totalFailures += result.failures;
                        totalBrowserFailures += result.browserFailures;
                })
        ),
        Promise.resolve()
)
.then(() => {
        console.log();
        console.log();
        console.log(`[karma-mocha-webworker] All runs with all config files have been completed`);
        console.log(`[karma-mocha-webworker] There were a total of ${totalFailures} failures`);
        console.log(`[karma-mocha-webworker] There were a total of ${totalBrowserFailures} failures when attempting to start a browser`);

        if (totalFailures > 0 || totalBrowserFailures > 0) {
                process.exitCode = 2;
        }
});
