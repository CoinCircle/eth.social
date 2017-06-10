/* eslint-env mocha */
'use strict'

const React = require('react')
const expect = require('chai').expect
const {render} = require('enzyme')

const SourceLink = require('../../lib/components/content/source-link')

describe('<SourceLink />', () => {
  it('renders', () => {
    const context = {
      github: 'github.com/source.js',
      path: 'source.js'
    }
    const link = render(
      <SourceLink context={context} />
    ).find('a')

    expect(link.attr('href')).to.be.eql(context.github)
    expect(link.attr('title')).to.be.eql(context.path)
  })

  it('renders nothing if context is missing', () => {
    expect(
      render(<SourceLink />).html()
    ).to.be.eql('')
  })
})
