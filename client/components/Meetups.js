const moment = require('moment')
const React = require('react')
const ReactDOM = require('react-dom')

const {getInstance} = require('../services/contract')
const { getPosts } = require('../services/query')

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

    let meetups = []

    try {
      const parsed = JSON.parse(sessionStorage.getItem('meetups'))
      if (parsed) {
        meetups = parsed
      }
    } catch (error) {

    }

    this.state = {
      meetups,
      showSpinner: !meetups.length
    }
  }

  componentDidMount () {
    this.getMeetups()
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
        <div className="column twelve wide">
          {!meetups.length && !showSpinner ? <div className="ui message info">No meetups</div> : null}
          <Spinner show={showSpinner} />
          {meetups.length ?
            <div className="MeetupRows">
            {meetups.map((meetup, i) => {
              var size = meetups.length

              return ([
                <div className="MeetupRow" key={i}>
                  <div className="ui grid stackable">
                    <div className="column sixteen wide">
                      <datetime className="MeetupRowDate">
                        <strong>{formatDate(meetup.start, 'ddd, MMM DD')} </strong>
                        {formatDate(meetup.start, 'hh:mmA')}
                      </datetime>
                    </div>
                    <div className="column sixteen wide">
                      <div className="ui grid stackable BoxFrame">
                        <div className="column sixteen wide MeetupRowContent">
                          <div className="ui bordered image fluid">
                            <a href={`#/meetups/${meetup.id}`}><img src={meetup.imageUrl} alt="" /></a>
                          </div>
                          <div className="content">
                            <div className="ui large header MeetupRowTitle overflow-y">
                              <a href={`#/meetups/${meetup.id}`}>
                                {meetup.title}
                              </a>
                            </div>
                            <div className="description overflow-y">
                              {meetup.description}
                            </div>
                          </div>
                        </div>
                        <div className="column sixteen wide MeetupRowMeta">
                          <a href={`#/meetups/${meetup.id}`}>
                          <span className="ui label">
                            {meetup.id}
                          </span>
                          </a>
                          <a href={`https://www.google.com/maps?q=${meetup.location}`} target="_blank" rel="noreferrer noopener">
                            <i className="icon marker"></i>
                            {meetup.location}
                          </a>
                        <span>
                          <i className="icon tag"></i>{meetup.tags.map((tag, i) => {
                            return <i className="ui tiny label" key={i}>{tag}</i>
                          })}
                        </span>
                        <a href={`#/organizer/${meetup.organizer}`}>
                      <i className="icon user"></i>
                        organizer</a>
                          <datetime>Created {formatDate(meetup.updated)}</datetime>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>,
               i === size-1 ? null : <div className=""></div>
              ])
            })}
          </div>
        : null}
      </div>
    </div>
    )
  }

  async getMeetups() {
    //this.setState({showSpinner: true})

    try {
      const meetups = await getInstance().getAllMeetups()
      this.setState({meetups})

      sessionStorage.setItem('meetups', JSON.stringify(meetups))
    } catch (error) {
      handleError(error)
    }

    this.setState({showSpinner: false})
  }
}

module.exports = Meetups
