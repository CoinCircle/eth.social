const React = require('react')
const ReactDOM = require('react-dom')
const moment = require('moment')

const Datetime = require('react-datetime')

const {getInstance} = require('../services/contract')

function handleError(error) {
  console.error(error)
}

var meetup = {
  title: '',
  description: '',
  startTimestamp: '',
  endTimestamp: ''
}

class NewMeetup extends React.Component {
  render() {
    return (
    <div className="ui grid padded row">
      <div className="column sixteen wide">
        <h3 className="ui header">
          New Meetup
        </h3>
      </div>
      <div className="column sixteen wide">
        <form className="ui form">
          <div className="field">
            <label>Title</label>
            <div className="ui input">
              <input
                type="text"
                placeholder="Title"
                onChange={this.onTitleChange.bind(this)}
              />
            </div>
          </div>
          <div className="field">
            <label>Description</label>
            <div className="ui input">
              <textarea
                placeholder="Description"
                onChange={this.onDescriptionChange.bind(this)}
              ></textarea>
            </div>
          </div>
          <div className="field">
            <label>Start Date</label>
            <Datetime
              defaultValue={moment().add(1, 'hour').startOf('hour')}
              onChange={this.onStartDateChange.bind(this)}
            />
          </div>
          <div className="field">
            <label>End Date</label>
            <Datetime
              defaultValue={moment().add(2, 'hour').startOf('hour')}
              onChange={this.onEndDateChange.bind(this)}
            />
          </div>
          <div className="field">
            <button className="ui button green" onClick={this.handleSubmit}>Create</button>
          </div>
        </form>
      </div>
    </div>
    )
  }

  onTitleChange(event) {
    meetup.title = event.target.value
  }

  onDescriptionChange(event) {
    meetup.description = event.target.value
  }

  onStartDateChange(momentDate) {
    meetup.startTimestamp = momentDate.unix()
  }

  onEndDateChange(momentDate) {
    meetup.endTimestamp = momentDate.unix()
  }

  handleSubmit(event) {
    event.preventDefault()

    getInstance()
    .createMeetup(meetup)
    .then(tx => {
      console.log(tx)
      window.location.href = '/'
    })
    .catch(handleError)
  }
}

module.exports = NewMeetup
