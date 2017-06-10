var mochaReporters = require('mocha/lib/reporters');
var EventEmitter = require('events').EventEmitter;

var getMochaReporter = function(reporterName) {

    var MochaReporter = mochaReporters[reporterName];

    if (!MochaReporter) {

        try {

            MochaReporter = require(reporterName);

        } catch (err) {

            if (err.message.indexOf('Cannot find module') >= 0) {

                console.warn('"' + reporterName + '" reporter not found');

            } else {

                console.warn('"' + reporterName + '" reporter blew up with error:\n' + err.stack);

            }

        }

    }

    if (!MochaReporter && reporterName === 'teamcity') {

        console.warn('The Teamcity reporter was moved to a package named ' +
            'mocha-teamcity-reporter ' +
            '(https://npmjs.org/package/mocha-teamcity-reporter).');

    }

    if (!MochaReporter) throw new Error('invalid reporter "' + reporterName + '"');

    return MochaReporter;

};

var Reporter = function(baseReporterDecorator, formatError, reportSlowerThan, pluginConfig) {

    baseReporterDecorator(this);

    var reporterName = (pluginConfig && pluginConfig.reporter) || 'spec';
    var MochaReporter = getMochaReporter(reporterName);

    var createMochaTestResult = function(result) {

        return {
            title: result.description,
            fullTitle: function() {

                return result.suite.concat(result.description).join(' ');

            },
            duration: result.time,
            slow: function() {

                return reportSlowerThan;

            }
        };

    };
    var createMochaErrors = function(result) {

        return result.log.map(function(log, k) {

            var formattedStack = formatError(log);

            if (result.assertionErrors && result.assertionErrors[k]) {

                var err = result.assertionErrors[k];

                err.stack = formattedStack;

                return err;

            } else {

                return {
                    message: formattedStack
                };

            }

        });

    };

    var runner;

    this.onRunStart = function(browsers) {

        runner = new EventEmitter();
        var mochaReporter = new MochaReporter(runner); // eslint-disable-line no-unused-vars

        runner.emit('start');
        runner.emit('suite', {
            title: '',
            root: true
        });

    };

    this.onBrowserStart = function(browser) {

    };

    var lastSuites = [];

    this.onSpecComplete = function(browser, result) {

        var suites = result.suite;

        var maxCommon = 0;

        for (var i = 0, n = Math.min(lastSuites.length, suites.length); i < n; i++) {

            if (lastSuites[i] === suites[i]) maxCommon = i + 1;
            else break;

        }

        lastSuites.slice(maxCommon).reverse().forEach(function(suiteName) {

            runner.emit('suite end');

        });

        suites.slice(maxCommon).forEach(function(suiteName) {

            runner.emit('suite', {
                title: suiteName,
                root: false
            });

        });

        lastSuites = suites;

        var mochaTestResult = createMochaTestResult(result);

        if (result.success) runner.emit('pass', mochaTestResult);
        else if (result.skipped) runner.emit('pending', mochaTestResult);
        else {

            createMochaErrors(result).forEach(function(err) {

                runner.emit('fail', mochaTestResult, err);

            });

        }

    };

    this.onRunComplete = function(browsers, results) {

        var revLastSuites = lastSuites.slice().reverse();

        lastSuites = [];
        revLastSuites.forEach(function(suiteName, k) {

            runner.emit('suite end');

        });

        runner.emit('suite end');
        runner.emit('end');

    };

};

Reporter.$inject = ['baseReporterDecorator', 'formatError', 'config.reportSlowerThan', 'config.mochaOwnReporter'];

module.exports = {
    'reporter:mocha-own': ['type', Reporter]
};
