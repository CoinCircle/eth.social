# js-multicodec

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](http://ipn.io)
[![](https://img.shields.io/badge/project-multiformats-blue.svg?style=flat-square)](https://github.com/multiformats/multiformats)
[![](https://img.shields.io/badge/freenode-%23ipfs-blue.svg?style=flat-square)](https://webchat.freenode.net/?channels=%23ipfs)
[![](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![Travis CI](https://img.shields.io/travis/multiformats/js-multicodec.svg?style=flat-square&branch=master)](https://travis-ci.org/multiformats/js-multicodec)

> JavaScript implementation of the multicodec specification

## Install

```sh
> npm install multicodec
```

```JavaScript
const multicodec = require('multicodec')
```

## Usage

### Example

```JavaScript

const multicodec = require('multicodec')

const prefixedProtobuf = multicodec.addPrefix('protobuf', protobufBuffer)
// prefixedProtobuf 0x50...
```

## API

https://multiformats.github.io/js-multicodec/

## [multicodec default table](https://github.com/multiformats/multicodec/blob/master/table.csv)

## Maintainers

Captain: [@diasdavid](https://github.com/diasdavid).

## Contribute

Contributions welcome. Please check out [the issues](https://github.com/multiformats/js-multicodec/issues).

Check out our [contributing document](https://github.com/multiformats/multiformats/blob/master/contributing.md) for more information on how we work, and about contributing in general. Please be aware that all interactions related to multiformats are subject to the IPFS [Code of Conduct](https://github.com/ipfs/community/blob/master/code-of-conduct.md).

Small note: If editing the README, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

[MIT](LICENSE) © 2016 Protocol Labs Inc.
