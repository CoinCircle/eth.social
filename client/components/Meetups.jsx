const React = require('react')
const ReactDOM = require('react-dom')

const {getInstance} = require('../services/contract')

function handleError(error) {
  console.error(error)
}

class App extends React.Component {
 constructor(props) {
    super(props)

    this.state = {
      meetups: []
    }

    setTimeout(() => {
      this.getMeetups()
    }, 1005)
  }

  render() {
    const meetups = this.state.meetups

    return <ul>{meetups.map((meetup, i) => {
      return <li key={i}>{meetup.title}</li>
    })}</ul>
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

module.exports = App
