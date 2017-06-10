# karma-mocha-webworker
[![Travis CI Build Status](https://api.travis-ci.org/Joris-van-der-Wel/karma-mocha-webworker.svg?branch=master)](https://travis-ci.org/Joris-van-der-Wel/karma-mocha-webworker)

Karma plugin which runs your mocha tests in a WebWorker.

Using this plugin you can test your javascript code for WebWorker compatibility.

## Usage
Install the module and save it as a `devDependency`:

```bash
npm install karma-mocha-webworker --save-dev
```

Instructions on how to install `karma` can be found [here](http://karma-runner.github.io/0.12/intro/installation.html).

You will then have to configure your karma config:

```javascript
module.exports = config => {
  config.set({
    // 1. Load this karma plugin
    frameworks : ['mocha-webworker'],

    // 2. Configure the files you would like karma to serve.
    //    Make sure you set `included` to `false`. Otherwise karma
    //    will execute your scripts outside of the WebWorker.
    files      : [
      {pattern: 'test/my-test-case.js', included: false},
      {pattern: 'test/more-test-cases/*.js', included: false}
    ],

    client     : {
      // 3. Configure the URLs that this plugin should execute
      //    within a WebWorker for you. These patterns are
      //    matched (using minimatch) on the `config.files`
      //    array configured in step 2.
      //    If you omit `pattern`, all URLs will be executed.
      mochaWebWorker: {
        pattern : [
          'test/my-test-case.js',
          'test/more-test-cases/*.js'
        ],
        // You can also use a SharedWorker for test execution
        // instead of the default 'Worker'
        worker: 'SharedWorker',
        // You can also pass some options to mocha:
        mocha   : {
          ui: 'tdd'
        },
        // You can also evaluate javascript code within the Worker at various stages:
        evaluate: {
          beforeMochaImport: 'self.console.log("Before the mocha script is imported")',
          beforeMochaSetup : 'self.console.log("Before mocha is setup (mocha.setup())")',
          beforeScripts    : 'self.console.log("Before your scripts are imported")',
          beforeRun        : 'self.console.log("Before your tests are run (mocha.run())")',
          afterRun         : 'self.console.log("After your tests have been run")'
        }
      }
    }
  });
};
```

## Grep
To run only some test cases matching a given pattern, you can use:

```bash
karma start &
karma run -- --grep foo
```

## Google Chrome Caveat
Google Chrome currently (tested up to v55) does not pass on stack information when an error occurs within a script loaded into a Web Worker (e.g. `importScripts(['foo.js'])`). So if your script contains a syntax error or a runtime error, the stack will point at a line within karma-mocha-webworker. You can workaround this issue by using Firefox.
