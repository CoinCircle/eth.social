'use strict'

const React = require('react')
const Radium = require('radium')

const Utils = require('../../utils')
const Type = require('./type')
const {lineHeight} = require('../styles')

const ListItem = Radium(({
  name,
  val,
  defaultVal,
  description,
  utils
}) => {
  const descriptionStyle = {
    display: 'inline-block'
  }
  const liStyle = {
    paddingBottom: lineHeight(0.5)
  }

  return (
    <li style={liStyle}>
      <Type
        name={name}
        val={val}
        defaultVal={defaultVal}
        utils={utils} />
    : &nbsp;
    <div
      style={descriptionStyle}
      dangerouslySetInnerHTML={{
        __html: utils.md(description, true)
      }} />
    </li>
  )
})

const Param = ({
  name,
  typeVal,
  defaultVal,
  description,
  properties,
  utils
}) => {
  let propertyList

  if (properties && properties.length > 0) {
    propertyList = properties.map((p) => (
      <ListItem
        key={p.name}
        name={p.name}
        val={p.type}
        defaultVal={p.default}
        description={p.description}
        utils={utils} />
    ))
  }

  return (
    <div>
      <ListItem
        key='1'
        name={name}
        val={typeVal}
        defaultVal={defaultVal}
        description={description}
        utils={utils} />
      {propertyList}
    </div>
  )
}

Param.propTypes = {
  name: React.PropTypes.string.isRequired,
  typeVal: React.PropTypes.any,
  defaultVal: React.PropTypes.string,
  description: React.PropTypes.object,
  properties: React.PropTypes.array,
  utils: React.PropTypes.instanceOf(Utils).isRequired
}

module.exports = Radium(Param)
