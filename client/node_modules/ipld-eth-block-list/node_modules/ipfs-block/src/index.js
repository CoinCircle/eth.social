'use strict'

const multihashing = require('multihashing-async')
const setImmediate = require('async/setImmediate')

module.exports = Block

/**
 * Represents an immutable block of data that is uniquely referenced with a multihash key.
 *
 * @constructor
 * @param {Buffer | string} data - The data to be stored in the block as a buffer or a UTF8 string.
 * @example
 * const block = new Block('a012d83b20f9371...')
 */
function Block (data) {
  if (!(this instanceof Block)) {
    return new Block(data)
  }

  if (!data) {
    throw new Error('Block must be constructed with data')
  }

  if (!(typeof data === 'string' || Buffer.isBuffer(data))) {
    throw new Error('data should be Buffer')
  }

  if (!Buffer.isBuffer(data)) {
    data = new Buffer(data)
  }

  this._cache = {}

  data = ensureBuffer(data)

  Object.defineProperty(this, 'data', {
    get () {
      return data
    },
    set () {
      throw new Error('Tried to change an immutable block')
    }
  })

  /**
  * Creates a unique multihash key of this block.
  *
  * @param {string} [hashFunc='sha2-256'] - The hash function to use.
  * @param {function(Error, Multihash)} callback - The callback to execute on completion.
  * @returns {void}
  * @example
  * block.key((multihash) => {
  *   console.log(multihash)
  * })
  * // 'QmeoBGh5g5kHgK3xppJ1...'
  **/
  this.key = (hashFunc, callback) => {
    if (typeof hashFunc === 'function') {
      callback = hashFunc
      hashFunc = null
    }

    if (!hashFunc) {
      hashFunc = 'sha2-256'
    }

    if (this._cache[hashFunc]) {
      return setImmediate(() => {
        callback(null, this._cache[hashFunc])
      })
    }

    multihashing(this.data, hashFunc, (err, multihash) => {
      if (err) {
        return callback(err)
      }
      this._cache[hashFunc] = multihash
      callback(null, multihash)
    })
  }
}

function ensureBuffer (data) {
  if (Buffer.isBuffer(data)) {
    return data
  }

  return new Buffer(data)
}
