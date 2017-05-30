const React = require('react')
const ReactDOM = require('react-dom')

const NewMeetup = require('./NewMeetup.jsx')
const Meetups = require('./Meetups.jsx')

class App extends React.Component {
  render() {
    return (
      <div>
        <div>Meetups</div>
        <Meetups />
        <NewMeetup />
      </div>
    )
  }
}

module.exports = App
