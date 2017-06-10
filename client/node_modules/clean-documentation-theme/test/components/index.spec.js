/* eslint-env mocha */
'use strict'

require('babel-register')

describe('Components', () => {
  require('./app-test')
  require('./source-link-test')
  require('./returns-test')
  require('./throws-test')
  require('./extends-test')
  require('./see-test')
})
