
# Karma Mocha Own Reporter

[![Build Status](https://travis-ci.org/roadhump/karma-mocha-own-reporter.svg)](https://travis-ci.org/roadhump/karma-mocha-own-reporter)

[Karma](http://karma-runner.github.com) plugin to make possibble to use [Mocha](http://mochajs.org/) own reporters (including diff output).

You should use [karma-mocha](https://github.com/karma-runner/karma-mocha) plugin and any decent assertion library ([expect.js](https://github.com/Automattic/expect.js), [chai](https://github.com/chaijs/chai), etc).

## Installation

```
npm install karma-mocha-own-reporter --save-dev
```

## Configuration

`karma.conf.js`

```js
{
    reporters: ["mocha-own"],

    mochaOwnReporter: {
        reporter: 'nyan'
    }
}
```

![output](./success.png)
![output](./failure.png)

## Diff Output

Coming very soon.

## Issues

Please file issues on the [issue tracker on GitHub](https://github.com/roadhump/karma-mocha-own-reporter/issues).
