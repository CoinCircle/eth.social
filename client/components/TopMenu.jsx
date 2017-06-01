const React = require('react')
const ReactDOM = require('react-dom')

const {
  Link
} = require('react-router-dom')

class App extends React.Component {
  render() {
    return (
      <div className="ui grid row">
        <div className="column sixteen wide">
          <div className="top ui menu">
            <Link to="/" className="item logo">eth.social</Link>
            <Link to="/meetups" className="item">Meetups</Link>
            <Link to="/new" className="item">New Meetup</Link>
            <div className="right menu">
              <Link to="/about" className="item">About</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

module.exports = App
