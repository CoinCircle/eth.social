'use strict'

const React = require('react')
const Radium = require('radium')

const GoCode = require('react-icons/lib/go/code')

const SourceLink = ({context}) => {
  if (!context || !context.github) {
    return null
  }

  const style = {
    float: 'right'
  }

  return (
    <a
      href={context.github}
      title={context.path}
      style={style}>
      <GoCode />
    </a>
  )
}

SourceLink.propTypes = {
  context: React.PropTypes.object
}

module.exports = Radium(SourceLink)
