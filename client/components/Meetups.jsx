const moment = require('moment')
const React = require('react')
const ReactDOM = require('react-dom')

const {getInstance} = require('../services/contract')

const Spinner = require('./Spinner.jsx')

function handleError(error) {
  console.error(error)
}

function formatDate(timestamp) {
  return moment.unix(timestamp).format('MM/DD/YYYY hh:mmA')
}

class Meetups extends React.Component {
 constructor(props) {
    super(props)

    this.state = {
      meetups: []
    }

    setTimeout(() => {
      this.getMeetups()
    }, 1100)
  }

  render() {
    const meetups = this.state.meetups

    return (
      <div className="ui grid padded row">
        <div className="column sixteen wide">
          <h3 className="ui header">
            Meetups
          </h3>
        </div>
        <div className="column sixteen wide">
          <Spinner show={!meetups.length} />
          <div className="ui items">
            {meetups.map((meetup, i) => {
              return ([
                <div className="item" key={i}>
                  <div className="content">
                    <div className="header">
                      {meetup.title}
                    </div>
                    <div className="meta">
                      <p>Start: {formatDate(meetup.startTimestamp)}</p>
                      <p>End: {formatDate(meetup.endTimestamp)}</p>
                    </div>
                    <div className="description">
                      {meetup.description}
                    </div>
                    <div className="extra">
                      <p>Created: {formatDate(meetup.createdTimestamp)}</p>
                      <p>Organizer: {meetup.organizer}</p>
                    </div>
                  </div>
                </div>,
                <div className="ui divider"></div>
              ])
            })}
        </div>
      </div>
    </div>
    )
  }

  getMeetups() {
    getInstance()
    .getAllMeetups()
    .then(meetups => {
      console.log(meetups)
      this.setState({meetups})
    })
    .catch(handleError)
  }
}

module.exports = Meetups
