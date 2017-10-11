const React = require('react')
const ReactDOM = require('react-dom')

const {
  HashRouter: Router,
  Route,
  Link
} = require('react-router-dom')

const NewMeetup = require('./NewMeetup.js')
const EditMeetup = require('./EditMeetup.js')
const Meetups = require('./Meetups.js')
const Meetup = require('./Meetup.js')
const TopMenu = require('./TopMenu.js')
const About = require('./About.js')
const Help = require('./Help.js')
const Footer = require('./Footer.js')

class App extends React.Component {
  render() {
    return (
      <Router>
        <div>
        <TopMenu />
        <div className="ui grid stackable padded MainContentContainer">
          <Route exact path="/" component={Meetups}/>
          <Route exact path="/meetups" component={Meetups}/>
          <Route exact path="/meetup/new" component={NewMeetup}/>
          <Route exact path="/meetups/:id([0-9]+)/edit" component={EditMeetup}/>
          <Route exact path="/meetups/:id([0-9]+)" component={Meetup}/>
          <Route exact path="/about" component={About}/>
          <Route exact path="/help" component={Help}/>
        </div>
        <Footer />
        </div>
      </Router>
    )
  }
}

module.exports = App
