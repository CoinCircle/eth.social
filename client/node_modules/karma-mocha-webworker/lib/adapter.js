'use strict';

require('./firefoxProtoWorkaround')();
const minimatch = require('minimatch');
const JSONBird = require('jsonbird');

const Worker = global.Worker;
const SharedWorker = global.SharedWorker;
const karma = global.__karma__;

const patternsFromConfig = configValue => {
        const patterns = [];

        for (const pattern of (Array.isArray(configValue) ? configValue : [configValue])) {
                if (!pattern) {
                        continue;
                }

                const patternFn = minimatch.filter(pattern, {
                        matchBase: true,
                });

                patterns.push(patternFn);
        }

        return patterns;
};

const urlMatchesPatterns = (patterns, url) => {
        const matchUrl = url.replace(/^\/base\//, '');

        for (const pattern of patterns) {
                if (pattern(matchUrl)) {
                        return true;
                }
        }

        return false;
};

karma.start = () => {
        const myConfig = karma.config.mochaWebWorker || karma.config['mocha-webworker'] || {};
        let workerUrl;
        let sharedWorkerUrl;
        let mochaUrl;
        const userScriptUrls = [];
        const patterns = patternsFromConfig(myConfig.pattern);
        const workerType = myConfig.worker || 'Worker';

        for (const url of Object.keys(karma.files)) {
                const sha = karma.files[url];
                const noCacheUrl = url + '?' + sha;

                if (/karma-mocha-webworker-client\/worker\.js$/.test(url)) {
                        workerUrl = noCacheUrl;
                }
                else if (/karma-mocha-webworker-client\/shared-worker\.js$/.test(url)) {
                        sharedWorkerUrl = noCacheUrl;
                }
                else if (/karma-mocha-webworker-client\/adapter\.js$/.test(url)) {
                        // noop, never match this script in a pattern
                }
                else if (/mocha\/mocha\.js$/.test(url)) {
                        mochaUrl = noCacheUrl;
                }
                else if (patterns.length) {
                        if (urlMatchesPatterns(patterns, url)) {
                                userScriptUrls.push(noCacheUrl);
                        }
                        else {
                                console.log('[karma-mocha-webworker] Skipping url because it does ' +
                                            'not match the given pattern(s)', url);
                        }
                }
                else { // no pattern(s) have been configured
                        userScriptUrls.push(noCacheUrl);
                }
        }

        if (!mochaUrl) {
                throw Error('[karma-mocha-webworker] Unable to find url for mocha/mocha.js in __karma__.files');
        }

        let worker;
        let workerPort;

        if (workerType === 'Worker') {
                if (!workerUrl) {
                        throw Error('[karma-mocha-webworker] Unable to find url for worker.js in __karma__.files');
                }

                worker = new Worker(workerUrl);
                workerPort = worker;
        }
        else if (workerType === 'SharedWorker') {
                if (!SharedWorker) {
                        throw new Error('[karma-mocha-webworker] There is no support for shared workers');
                }

                if (!sharedWorkerUrl) {
                        throw Error('[karma-mocha-webworker] Unable to find url for shared-worker.js in __karma__.files');
                }

                worker = new SharedWorker(sharedWorkerUrl);
                workerPort = worker.port;
        }
        else {
                throw new Error(
                        '[karma-mocha-webworker] Invalid karma configuration value for "client.mochaWebWorker.worker". ' +
                        'Expected "Worker" or "SharedWorker" instead of "' + workerType + '"'
                );
        }

        const rpc = new JSONBird({
                readableMode: 'object',
                writableMode: 'object',
                receiveErrorStack: true,
                sendErrorStack: true,
        });
        rpc.on('error', error => console.error('[karma-mocha-webworker] Error during RPC', error, error.stack));
        workerPort.onmessage = e => rpc.write(e.data);

        rpc.on('data', object => workerPort.postMessage(object));

        const doEvaluateHook = phase => Promise.resolve().then(() => {
                if (myConfig.evaluate && myConfig.evaluate[phase]) {
                        return rpc.call('eval', myConfig.evaluate[phase]);
                }

                return null;
        });

        rpc.notifications({
                ready: () => Promise.resolve()
                        .then(() => doEvaluateHook('beforeMochaImport'))
                        .then(() => rpc.call('importScripts', [mochaUrl]))
                        .then(() => doEvaluateHook('beforeMochaSetup'))
                        .then(() => rpc.call('setupMocha', myConfig.mocha))
                        .then(() => doEvaluateHook('beforeScripts'))
                        .then(() => rpc.call('importScripts', userScriptUrls))
                        .then(() => doEvaluateHook('beforeRun'))
                        .then(() => rpc.call('runMocha', karma.config.args))
                        .catch(error => karma.error(`[karma-mocha-webworker] ${error.name}: ${error.message} at ${error.stack}`)),

                mochaRunComplete() {
                        return doEvaluateHook('afterRun');
                },

                karmaInfo(data) {
                        karma.info(data);
                },

                karmaComplete(data) {
                        karma.complete(data);
                },

                karmaResult(data) {
                        karma.result(data);
                },
        });
};
