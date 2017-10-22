const moment = require('moment')
const React = require('react')
const ReactDOM = require('react-dom')

const {getInstance} = require('../services/contract')
const {getDefaultAccount} = require('../services/account')
const {uploadJson} = require('../services/ipfs')

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

    this.getMeetup()
    .then(() => {})
    .catch(() => {
      window.location.href = '#/'
    })
    .then(() => {
      this.setState({showSpinner: false})
    })
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
        <div className="column ten wide">
          {showSpinner ?
            <Spinner show={showSpinner} />
          :
            <div className="ui items">
                <div className="item">
                  <div className="ui grid stackable">
                  <div className="column sixteen wide">
                    <h3 className="ui huge header">
                      {meetup.title}
                    </h3>
                  </div>
                  <div className="column sixteen wide MeetupDescription">
                      <p>{meetup.description}</p>
                  </div>
                    <div className="column eight wide">
                      <div className="ui bordered image fluid MeetupImage">
                        <a href={meetup.imageUrl} target="_blank" rel="noopener noreferrer">
                          <img src={meetup.imageUrl} alt="" /></a>
                      </div>
                    </div>
                    <div className="column eight wide">
                    <div className="content">
                        <div className="meta">
                          <p><i className="icon wait"></i> Starts {formatDate(meetup.start, 'dddd, MMMM DD, hh:mmA')}</p>
                          <p><i className="icon wait"></i> Ends {formatDate(meetup.end, 'MMMM DD, hh:mmA')}</p>
                          <p><i className="icon marker"></i> <a href={`https://www.google.com/maps?q=${meetup.location}`} target="_blank" rel="noopener noreferrer">{meetup.location}</a></p>
                        </div>
                        <div className="extra">
                          <p><i className="icon tag"></i>{meetup.tags.map((tag, i) => {
                            return <span className="ui tiny label" key={i}>{tag}</span>
                          })}</p>
                          <p className="MeetupOrganizer"><small><i className="icon user"></i>&nbsp;
                          <a href={`#/organizer/${meetup.organizer}`} >{meetup.organizer}</a></small></p>
                      <p>ID <span className="ui label">{meetup.id}</span></p>

                          <p><small>Created {formatDate(meetup.created)}</small></p>
                          {meetup.updated ?
                          <p><small>Updated {formatDate(meetup.updated)}</small></p>
                          : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              {isOrganizer ?
                <div>
                <div className="ui divider"></div>
                <div className="ui tiny buttons">
                  <a
                    href={`#/meetups/${id}/edit`}
                    className="ui tiny icon blue button labeled icon">
                    <i className="icon edit"></i>
                    Edit
                  </a>
                  <a className="ui tiny icon button labeled icon"
                    onClick={this.onMeetupDelete.bind(this)}>
                    <i className="icon trash"></i>
                    Delete
                  </a>
                </div>
                </div>
              : null}
            </div>
            }
        </div>
        <div className="column ten wide">
          <Comments />
        </div>
      </div>
    )
  }

  async getMeetup() {
    const {id} = this.state
    const meetup = await getInstance().getMeetupById(id)
    this.setState({meetup})
    return meetup
  }

  async onMeetupDelete (event) {
    event.preventDefault()

    const {id} = this.state

    const meetup = await getInstance().getMeetupById(id)
    meetup.deleted = true

    const [result] = await uploadJson(meetup)
    const {hash:ipfsHash} = result

    try {
      await getInstance().editMeetup({id, ipfsHash})
      window.location.href = `#/meetups`
    } catch (error) {
      alert(error)
    }
  }
}

module.exports = Meetup
