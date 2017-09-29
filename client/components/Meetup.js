const moment = require('moment')
const React = require('react')
const ReactDOM = require('react-dom')

const {getInstance} = require('../services/contract')
const {getDefaultAccount} = require('../services/account')

const Spinner = require('./Spinner.js')
const Comments = require('./Comments.js')

function formatDate(timestamp, format='MM/DD/YYYY hh:mmA') {
  return moment.unix(timestamp).format(format)
}

class Meetup extends React.Component {
 constructor(props) {
    super(props)
    const {id} = props.match.params

    this.state = {
      id,
      meetup: null,
      showSpinner: true
    }

    setTimeout(() => {
      this.getMeetup()
      .then(() => {})
      .catch(() => {
        window.location.href = '#/'
      })
      .then(() => {
        this.setState({showSpinner: false})
      })
    }, 2000)
  }

  render() {
    const {
      meetup,
      showSpinner,
      id
    } = this.state

    const isOrganizer = meetup && meetup.organizer === getDefaultAccount()

    return (
      <div className="ui grid padded row MeetupGrid">
        <div className="column sixteen wide">
          <h3 className="ui huge header">
            Meetup
            <div className="sub header">
              {meetup ?
                <small>{meetup.id}</small>
              : null}
            </div>
          </h3>
          <div className="ui divider"></div>
        </div>
        <div className="column sixteen wide">
          {showSpinner ?
            <Spinner show={showSpinner} />
          :
            <div className="ui items segment">
                <div className="item">
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
                          <p><i className="icon wait"></i> Starts {formatDate(meetup.start, 'dddd, MMMM DD, hh:mmA')}</p>
                          <p><i className="icon wait"></i> Ends {formatDate(meetup.end, 'MMMM DD, hh:mmA')}</p>
                          <p><i className="icon marker"></i> <a href={`https://www.google.com/maps?q=${meetup.location}`} target="_blank">{meetup.location}</a></p>
                        </div>
                        <div className="extra">
                          <p><i className="icon tag"></i>{meetup.tags.map((tag, i) => {
                            return <span className="ui tiny label">{tag}</span>
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
                </div>

              {isOrganizer ?
                [<div className="ui divider"></div>,
                <div className="ui tiny buttons">
                  <a
                    href={`#/meetups/${id}/edit`}
                    className="ui tiny icon blue button">
                    <i className="icon edit"></i>
                    Edit
                  </a>
                  <a className="ui tiny icon button"
                    onClick={this.onMeetupDelete.bind(this)}>
                    <i className="icon trash red"></i>
                    Delete
                  </a>
                </div>]
              : null}
            </div>
            }
        </div>
        <div className="column sixteen wide">
          <Comments />
        </div>
      </div>
    )
  }

  getMeetup() {
    const {id} = this.state
    return getInstance()
    .getMeetupById(id)
    .then(meetup => {
      console.log(meetup)
      this.setState({meetup})
    })
  }

  onMeetupDelete(event) {
    event.preventDefault()

    const {id} = this.state

    return getInstance()
    .deleteMeetupById(id)
    .then(meetup => {
      console.log(meetup)
      this.setState({meetup})
      window.location.href = '#'
    })
    .catch(error => {
      console.error(error)
      alert('Error deleting meetup')
    })
  }
}

module.exports = Meetup
