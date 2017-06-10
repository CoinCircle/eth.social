/* eslint-env mocha */
'use strict'

const React = require('react')
const expect = require('chai').expect
const {render} = require('enzyme')
const remark = require('remark')

const Throws = require('../../lib/components/content/throws')
const Utils = require('../../lib/utils')

describe('<Throws />', () => {
  const utils = new Utils({}, [])

  it('renders', () => {
    const throws = [{
      type: {
        type: 'NameExpression',
        name: 'Error'
      },
      description: remark().parse('bad error')
    }]
    const res = render(
      <Throws list={throws} utils={utils} />
    )

    expect(res.find('h4').text()).to.be.eql('Throws')
    const code = res.find('code')
    expect(code).to.have.length(1)
    expect(code.text()).to.be.eql('Error')

    const description = res.find('span')
    expect(description).to.have.length(1)
    expect(description.text()).to.be.eql(' bad error\n')
  })

  it('renders nothing if list is missing', () => {
    expect(
      render(<Throws utils={utils} />).html()
    ).to.be.eql('')
  })
})
