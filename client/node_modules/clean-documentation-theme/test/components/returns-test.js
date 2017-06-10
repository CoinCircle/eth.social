/* eslint-env mocha */
'use strict'

const React = require('react')
const expect = require('chai').expect
const {render} = require('enzyme')
const remark = require('remark')

const Returns = require('../../lib/components/content/returns')
const Utils = require('../../lib/utils')

describe('<Returns />', () => {
  const utils = new Utils({}, [])

  it('renders', () => {
    const returns = [{
      type: {
        type: 'NameExpression',
        name: 'Foo'
      },
      description: remark().parse('cool foo result')
    }]
    const res = render(
      <Returns list={returns} utils={utils} />
    )

    expect(res.find('h4').text()).to.be.eql('Returns')
    const code = res.find('code')
    expect(code).to.have.length(1)
    expect(code.text()).to.be.eql('Foo')

    const description = res.find('span')
    expect(description).to.have.length(1)
    expect(description.text()).to.be.eql(' cool foo result\n')
  })

  it('renders nothing if list is missing', () => {
    expect(
      render(<Returns utils={utils} />).html()
    ).to.be.eql('')
  })
})
