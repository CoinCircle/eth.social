const React = require('react')
const ReactDOM = require('react-dom')
const moment = require('moment')

const {getInstance} = require('../services/contract')
const EditMeetup = require('./EditMeetup.js')

function handleError(error) {
  console.error(error)
}

function NewMeetup(props) {
  const {match} = props

  return (
    <EditMeetup isNew={true} match={match} />
  )
}

module.exports = NewMeetup
