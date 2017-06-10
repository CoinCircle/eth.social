/* eslint-env mocha */
'use strict'

const React = require('react')
const expect = require('chai').expect
const {render} = require('enzyme')

const See = require('../../lib/components/content/see')
const Utils = require('../../lib/utils')

describe('<See />', () => {
  const utils = new Utils({}, [])

  it('renders', () => {
    const list = [{
      title: 'see',
      description: '[link](github.com)'
    }, {
      title: 'other'
    }, {
      title: 'see',
      description: 'other things'
    }]
    const res = render(
      <See tags={list} utils={utils} />
    )

    expect(res.find('h4').text()).to.be.eql('See')

    const lis = res.find('li')
    expect(lis).to.have.length(2)

    const links = res.find('li a')
    expect(links).to.have.length(1)
    expect(links.attr('href')).to.be.eql('github.com')
    expect(links.text()).to.be.eql('link')

    expect(lis.last().text()).to.be.eql('other things\n')
  })

  it('renders nothing if list is missing', () => {
    expect(
      render(<See utils={utils} />).html()
    ).to.be.eql('')
  })
})
