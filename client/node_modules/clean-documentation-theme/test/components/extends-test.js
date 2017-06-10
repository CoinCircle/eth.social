/* eslint-env mocha */
'use strict'

const React = require('react')
const expect = require('chai').expect
const {render} = require('enzyme')

const Extends = require('../../lib/components/content/extends')
const Utils = require('../../lib/utils')

describe('<Extends />', () => {
  const utils = new Utils({}, [])

  it('renders', () => {
    const list = [{
      name: 'Foo'
    }, {
      name: 'Bar'
    }]
    const res = render(
      <Extends list={list} utils={utils} />
    )

    expect(res.text()).to.be.eql(' Extends Foo, Bar.')
  })

  it('renders nothing if list is missing', () => {
    expect(
      render(<Extends utils={utils} />).html()
    ).to.be.eql('')
  })
})
