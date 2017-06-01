const React = require('react')
const ReactDOM = require('react-dom')

const {
  HashRouter: Router,
  Route,
  Link
} = require('react-router-dom')

const NewMeetup = require('./NewMeetup.jsx')
const Meetups = require('./Meetups.jsx')
const TopMenu = require('./TopMenu.jsx')
const About = require('./About.jsx')

class App extends React.Component {
  render() {
    return (
      <Router>
        <div>
        <TopMenu />
        <div className="ui grid padded">
          <Route exact path="/" component={Meetups}/>
          <Route path="/meetups" component={Meetups}/>
          <Route path="/new" component={NewMeetup}/>
          <Route path="/about" component={About}/>
        </div>
        </div>
      </Router>
    )
  }
}

module.exports = App
