/* eslint-env mocha */
'use strict'

const React = require('react')
const expect = require('chai').expect
const {render} = require('enzyme')

const App = require('../../lib/components/app')

describe('<App />', () => {
  it('renders', () => {
    expect(
      render(<App options={{}} docs={[]} />).children()
    ).to.have.length(1)
  })
})
