'use strict'

const React = require('react')
const Radium = require('radium')

const Utils = require('../../utils')
const Param = require('./param')

const Params = ({params, utils}) => {
  if (!params || !params.length) {
    return null
  }

  const listStyle = {
    listStyle: 'none',
    marginLeft: 0,
    paddingLeft: 0
  }

  return (
    <div>
      <h4>Parameters</h4>
      <ol style={listStyle}>
        {params.map((param) => (
          <Param
            key={param.name}
            name={param.name}
            typeVal={param.type}
            defaultVal={param.default}
            description={param.description}
            properties={param.properties}
            utils={utils} />
         ))}
      </ol>
    </div>
  )
}

Params.propTypes = {
  params: React.PropTypes.array,
  utils: React.PropTypes.instanceOf(Utils).isRequired
}

module.exports = Radium(Params)
