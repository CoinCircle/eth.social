'use strict'

const React = require('react')
const Radium = require('radium')

const Example = require('./example')
const Utils = require('../../utils')

const Examples = ({list, utils}) => {
  if (!list || !list.length) {
    return null
  }

  return (
    <div>
      {list.map((example, i) => (
        <Example
          key={i}
          name={example.caption}
          content={example.description}
          utils={utils} />
      ))}
    </div>
  )
}

Examples.propTypes = {
  list: React.PropTypes.array,
  utils: React.PropTypes.instanceOf(Utils).isRequired
}

module.exports = Radium(Examples)
