'use strict'

const React = require('react')
const Radium = require('radium')

const Utils = require('../../utils')

const Throws = ({list, utils}) => {
  if (!list || !list.length) {
    return null
  }

  return (
    <div>
      <h4>Throws</h4>
      {list.map((ret, i) => (
        <div key={i}>
          <code
            dangerouslySetInnerHTML={{
              __html: utils.formatType(ret.type)
            }} />{ret.description ? (
              <span
                dangerouslySetInnerHTML={{
                  __html: ' ' + utils.md(ret.description, true)
                }} />
             ) : null}
        </div>
      ))}
    </div>
  )
}

Throws.propTypes = {
  list: React.PropTypes.array,
  utils: React.PropTypes.instanceOf(Utils).isRequired
}

module.exports = Radium(Throws)
