const React = require('react')
const ReactDOM = require('react-dom')

const {
  HashRouter: Router,
  Route,
  Link
} = require('react-router-dom')

const NewMeetup = require('./NewMeetup.jsx')
const EditMeetup = require('./EditMeetup.jsx')
const Meetups = require('./Meetups.jsx')
const Meetup = require('./Meetup.jsx')
const TopMenu = require('./TopMenu.jsx')
const About = require('./About.jsx')
const Help = require('./Help.jsx')
const Footer = require('./Footer.jsx')

class App extends React.Component {
  render() {
    return (
      <Router>
        <div>
        <TopMenu />
        <div className="ui grid stackable padded">
          <Route exact path="/" component={Meetups}/>
          <Route exact path="/meetups" component={Meetups}/>
          <Route exact path="/meetup/new" component={NewMeetup}/>
          <Route exact path="/meetup/:id([0-9a-fA-f]{66})/edit" component={EditMeetup}/>
          <Route exact path="/meetup/:id([0-9a-fA-f]{66})" component={Meetup}/>
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
