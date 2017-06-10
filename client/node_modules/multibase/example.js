'use strict'

const multibase = require('multibase')

const encodedBuf = multibase.encode('base58btc', new Buffer('hey, how is it going'))

const decodedBuf = multibase.decode(encodedBuf)
console.log(decodedBuf.toString())
// => hey, how it going
