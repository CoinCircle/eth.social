/* @flow */
/* eslint-env mocha */
'use strict'

const memdown = require('memdown')

const LevelStore = require('../src')

describe('LevelDatastore', () => {
  describe('interface-datastore (memdown)', () => {
    require('interface-datastore/src/tests')({
      setup (callback) {
        callback(null, new LevelStore('hello', {db: memdown}))
      },
      teardown (callback) {
        memdown.clearGlobalStore()
        callback()
      }
    })
  })
})
