# js-datastore-level

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](http://ipn.io)
[![](https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square)](http://ipfs.io/)
[![](https://img.shields.io/badge/freenode-%23ipfs-blue.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23ipfs)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![Build Status](https://travis-ci.org/ipfs/js-datastore-level.svg)](https://travis-ci.org/ipfs/js-datastore-level) [![Circle CI](https://circleci.com/gh/ipfs/js-datastore-level.svg?style=svg)](https://circleci.com/gh/ipfs/js-datastore-level)
[![Coverage Status](https://coveralls.io/repos/github/ipfs/js-datastore-level/badge.svg?branch=master)](https://coveralls.io/github/ipfs/js-datastore-level?branch=master) [![Dependency Status](https://david-dm.org/diasdavid/js-peer-id.svg?style=flat-square)](https://david-dm.org/ipfs/js-datastore-level)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)
![](https://img.shields.io/badge/npm-%3E%3D3.0.0-orange.svg?style=flat-square)
![](https://img.shields.io/badge/Node.js-%3E%3D4.0.0-orange.svg?style=flat-square)

> Datastore implementation with [levelup](https://github.com/level/levelup) backend.

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Contribute](#contribute)
- [License](#license)

## Install

```
$ npm install datastore-level
```

## Usage

```js
const LevelStore = require('datastore-level')
// Default using leveldown as backend
const store = new LevelStore('path/to/store')

// use in the browser with level.js
const browserStore = new LevelStore('my/db/name', {db: require('level-js')})

// another leveldown compliant backend like memdown
const memStore = new LevelStore('my/mem/store', {db: require('memdown')})
```

## Contribute

PRs accepted.

Small note: If editing the Readme, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

MIT 2017 © IPFS
