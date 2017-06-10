'use strict'

const React = require('react')
const Radium = require('radium')

const Utils = require('../../utils')
const SectionMember = require('./section-member')

const SectionGroup = ({name, utils, members, parent}) => {
  const style = {
    textTransform: 'uppercase'
  }

  let displayParent
  if (name === 'static') {
    displayParent = parent
  } else if (name === 'instance') {
    displayParent = parent + '.prototype'
  }

  return (
    <div>
      <h2 style={style}>{name}</h2>
      {members.map((m, i) => (
        <SectionMember
          key={i}
          name={m.name}
          namespace={m.namespace}
          description={m.description}
          parent={displayParent}
          member={m}
          utils={utils} />
       ))}
    </div>
  )
}

SectionGroup.propTypes = {
  name: React.PropTypes.string.isRequired,
  members: React.PropTypes.array.isRequired,
  parent: React.PropTypes.string.isRequired,
  utils: React.PropTypes.instanceOf(Utils).isRequired
}

module.exports = Radium(SectionGroup)
