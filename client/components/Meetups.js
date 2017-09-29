const moment = require('moment')
const React = require('react')
const ReactDOM = require('react-dom')

const {getInstance} = require('../services/contract')

const Spinner = require('./Spinner.js')

function handleError(error) {
  console.error(error)
}

function formatDate(timestamp, format='MM/DD/YYYY hh:mmA') {
  return moment.unix(timestamp).format(format)
}

class Meetups extends React.Component {
 constructor(props) {
    super(props)

    this.state = {
      meetups: [],
      showSpinner: true
    }

    setTimeout(() => {
      this.getMeetups()
      .then(() => {})
      .catch(() => {})
      .then(() => {
        this.setState({showSpinner: false})
      })
    }, 2000)
  }

  render() {
    const meetups = this.state.meetups
    const showSpinner = this.state.showSpinner

    return (
      <div className="ui grid padded stackable MeetupsGrid">
        <div className="column sixteen wide">
          <h3 className="ui huge header">
            Meetups
          </h3>
          <div className="ui divider"></div>
        </div>
        <div className="column sixteen wide">
          {!meetups.length && !showSpinner ? <div className="ui message info">No meetups</div> : null}
          <Spinner show={showSpinner} />
          {meetups.length ?
            <div className="ui items segment">
            {meetups.map((meetup, i) => {
              var size = meetups.length

              return ([
                <div className="item" key={i}>
                  <div className="ui grid stackable">
                    <div className="column four wide">
                      <div className="ui bordered image fluid">
                        <a href={`#/meetups/${meetup.id}`}><img src={meetup.imageUrl} alt="" /></a>
                      </div>
                    </div>
                    <div className="column six wide">
                      <div className="content">
                        <div className="ui large header">
                          <a href={`#/meetups/${meetup.id}`}>{meetup.title}</a>
                        </div>
                        <div className="description">
                          {meetup.description}
                        </div>
                      </div>
                    </div>
                    <div className="column six wide">
                    <div className="content">
                        <div className="meta">
                          <p><i className="icon wait"></i> {formatDate(meetup.start, 'dddd, MMMM DD, hh:mmA')}</p>
                          <p><i className="icon marker"></i> <a href={`https://www.google.com/maps?q=${meetup.location}`} target="_blank">{meetup.location}</a></p>
                        </div>
                        <div className="extra">
                          <p><i className="icon tag"></i>{meetup.tags.map((tag, i) => {
                            return <span className="ui tiny label" key={i}>{tag}</span>
                          })}</p>
                          <p><small
                            style={{whiteSpace: 'nowrap'}}
                          ><i className="icon user"></i>&nbsp;
                          <a href={`#/organizer/${meetup.organizer}`}
                          style={{display: 'inline-block', maxWidth:'100%', overflow: 'auto'}}
                          >{meetup.organizer}</a></small></p>
                          <p><small
                            style={{whiteSpace: 'nowrap'}}
                          ><i className="icon linkify"></i>
                          &nbsp;
                          <a href={`#/meetups/${meetup.id}`}
                          style={{display: 'inline-block', maxWidth:'100%', overflow: 'auto'}}
                          >{meetup.id}</a></small></p>
                          <p><small>Created {formatDate(meetup.createdTimestamp)}</small></p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>,
               i === size-1 ? null : <div className="ui divider"></div>
              ])
            })}
          </div>
        : null}
      </div>
    </div>
    )
  }

  getMeetups() {
    return getInstance().getAllMeetups()
    .then(meetups => {
      console.log(meetups)
      this.setState({meetups})
    })
    .catch(handleError)
  }
}

module.exports = Meetups
