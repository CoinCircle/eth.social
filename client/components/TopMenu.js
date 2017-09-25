const React = require('react')
const ReactDOM = require('react-dom')

const {
  Link
} = require('react-router-dom')

class App extends React.Component {
  render() {
    return (
      <div className="ui grid stackable row TopMenu">
        <div className="column sixteen wide">
          <div className="top ui menu TopMenuFirst">
            <Link to="/" className="item logo">
              eth<strong>.social</strong>
            </Link>
            <Link to="/meetups" className="item">
              <i className="icon calendar"></i> Meetups
            </Link>
            <Link to="/meetup/new" className="item">
              <i className="icon plus circle"></i> New Meetup
            </Link>
            <div className="right menu">
              <Link to="/about" className="item">
                <i className="icon bookmark"></i> About
              </Link>
              <Link to="/help" className="item">
                <i className="icon help circle outline"></i> Help
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

module.exports = App

/*
  <Link to="/groups" className="item disabled">
    <i className="icon users"></i> Groups
  </Link>
  <Link to="/groups/new" className="item disabled">
    <i className="icon plus circle"></i> New Group
  </Link>
*/
