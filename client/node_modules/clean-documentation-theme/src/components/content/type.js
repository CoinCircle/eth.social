'use strict'

const React = require('react')

const Utils = require('../../utils')

const Type = ({name, val, defaultVal, utils}) => {
  let sig = `${name}: ${utils.formatType(val)}`
  if (defaultVal) {
    sig += ` (=${defaultVal})`
  }

  return (
    <code dangerouslySetInnerHTML={{__html: sig}} />
  )
}

Type.propTypes = {
  name: React.PropTypes.string,
  val: React.PropTypes.any,
  defaultVal: React.PropTypes.string,
  utils: React.PropTypes.instanceOf(Utils).isRequired
}

module.exports = Type
