const React = require('react')
const ReactDOM = require('react-dom')
const moment = require('moment')

const {getInstance} = require('../services/contract')

function handleError(error) {
  console.error(error)
}

class App extends React.Component {
  render() {
    return <form>
      <button onClick={this.handleSubmit}>Create</button>
    </form>
  }

  handleSubmit(event) {
    event.preventDefault()

    getInstance()
    .createMeetup({
      title: 'foo',
      description: 'bar',
      startTimestamp: moment().unix(),
      endTimestamp: moment().add(1, 'hour').unix()
    })
    .then(tx => {
      console.log(tx)
    })
    .catch(handleError)
  }
}

module.exports = App
