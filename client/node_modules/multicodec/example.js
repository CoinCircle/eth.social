'use strict'

const multicodec = require('multicodec')

const prefixedProtobuf = multicodec.addPrefix('protobuf', new Buffer('some protobuf code'))

console.log(prefixedProtobuf)
// => prefixedProtobuf 0x50...
