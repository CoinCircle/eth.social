/* eslint-env mocha */
'use strict'

const Syntax = require('doctrine').Syntax
const expect = require('chai').expect
const remark = require('remark')

const Utils = require('../lib/utils')

describe('utils', () => {
  const u = new Utils({hljs: {highlightAuto: false}}, [])

  describe('md', () => {
    it('renders remark asts', () => {
      expect(
        u.md(
          remark().parse(
            'Converts from `Result` to `?Error`'
          )
        )
      ).to.be.eql(
        '<p>Converts from <code>Result</code> to <code>?Error</code></p>\n'
      )
    })
  })

  it('.formatType', () => {
    const formatType = u.formatType

    expect(formatType(undefined)).to.be.eql('any')

    expect(formatType({
      type: 'NameExpression',
      name: 'Foo'
    })).to.be.eql('Foo')

    expect(formatType({
      type: 'NameExpression',
      name: 'Buffer'
    })).to.be.eql('<a href="https://nodejs.org/api/buffer.html">Buffer</a>')
  })

  it('.highlight', () => {
    expect(
      u.highlight('var text = "hello"')
    ).to.be.eql(
      '<span class="hljs-keyword">var</span> text = <span class="hljs-string">"hello"</span>'
    )
  })

  it('signature', () => {
    expect(
      u.signature({
        kind: 'class',
        name: 'Test',
        params: [{
          name: 'a',
          type: {type: Syntax.NumericLiteralType, value: 'number'}
        }]
      })
    ).to.be.eql(
      'new Test(a: <code>number</code>)'
    )

    expect(
      u.signature({
        kind: 'function',
        name: 'test',
        params: [{
          name: 'a',
          type: {type: Syntax.NumericLiteralType, value: 'number'}
        }],
        returns: [{
          type: {type: Syntax.NumericLiteralType, value: 'number'}
        }]
      })
    ).to.be.eql(
      'test(a: <code>number</code>): <code>number</code>'
    )

    expect(
      u.signature({
        kind: 'property',
        name: 'test',
        tags: [{
          title: 'type',
          type: {type: Syntax.NumericLiteralType, value: 'number'}
        }]
      })
    ).to.be.eql(
      'test: <code>number</code>'
    )
  })
})
