# Clean Documentation Theme

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](http://ipn.io)
[![](https://img.shields.io/badge/freenode-%23ipfs-blue.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23ipfs)
[![Build Status](https://travis-ci.org/dignifiedquire/clean-documentation-theme.svg?style=flat-square)](https://travis-ci.org/dignifiedquire/clean-documentation-theme) [![Coverage Status](https://coveralls.io/repos/github/dignifiedquire/clean-documentation-theme/badge.svg?branch=master)](https://coveralls.io/github/dignifiedquire/clean-documentation-theme?branch=master)
[![Dependency Status](https://david-dm.org/dignifiedquire/clean-documentation-theme.svg?style=flat-square)](https://david-dm.org/dignifiedquire/clean-documentation-theme)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)
![](https://img.shields.io/badge/npm-%3E%3D3.0.0-orange.svg?style=flat-square)
![](https://img.shields.io/badge/Node.js-%3E%3D4.0.0-orange.svg?style=flat-square)

> A theme for [documentationjs](https://github.com/documentationjs)

![](screenshot.png)

## Preview

- http://libp2p.github.io/js-peer-id/


It uses [React](https://facebook.github.io/react/) server side rendering with [Radium](https://github.com/FormidableLabs/radium/) for styling components.

## Usage

```bash
$ npm install --save-dev clean-documentation-theme
$ npm install --save-dev documentation
```

Add to your `package.json`

```json
"scripts": {
  "docs": "documentation build --format html --theme node_modules/clean-documentation-theme --o docs
"
  ...
}
```

and run

```
$ npm run docs
```

## License

MIT
