const React = require('react')
const ReactDOM = require('react-dom')

const {getInstance} = require('../services/contract')

class App extends React.Component {
  render() {
    return <form>
      <button onClick={this.handleSubmit}>Create</button>
    </form>
  }

  handleSubmit(event) {
    event.preventDefault()
    console.log("FOOO")
  }
}

module.exports = App
