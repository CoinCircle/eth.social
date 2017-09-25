const React = require('react')
const ReactDOM = require('react-dom')
const moment = require('moment')
const Datetime = require('react-datetime')

const Spinner = require('./Spinner.js')
const {getInstance} = require('../services/contract')
const {uploadFile, uploadFromUrl} = require('../services/upload')
const ipfsUrl = require('../utils/ipfsUrl')
const {DEFAULT_MEETUP_IMAGE} = require('../constants/defaults')

const defaultMeetup = {
  title: '',
  description: '',
  location: '',
  tags: '',
  image: '',
  startTimestamp: moment().add(1, 'day').startOf('hour').unix(),
  endTimestamp: moment().add(1, 'day').add(4, 'hour').startOf('hour').unix()
}

class EditMeetup extends React.Component {
 constructor(props) {
    super(props)

    this.state = {
      id: props.match.params.id,
      imageUrl: ipfsUrl(DEFAULT_MEETUP_IMAGE),
      isNew: props.isNew,
      meetup: defaultMeetup,
      showSpinner: false
    }

    if (this.state.id) {
      this.state.showSpinner = true

      setTimeout(() => {
        this.getMeetup()
        .then(() => {})
        .catch(() => {
          window.location.href = '#/'
        })
        .then(() => {
          this.setState({showSpinner: false})
        })
      }, 1100)
    }
  }

  render() {
    const {
      imageUrl,
      isNew,
      meetup,
      showSpinner
    } = this.state

    return (
    <div className="ui grid stackable padded">
      <div className="column sixteen wide">
        <h3 className="ui huge header">
          {isNew ? 'New Meetup' : 'Edit Meetup'}
        </h3>
        <div className="ui divider"></div>
      </div>
      <div className="column sixteen wide">
        {showSpinner ?
          <Spinner show={showSpinner} />
        :
        <form className="ui form">
          <div className="field required">
            <label><i className="icon pencil"></i> Title</label>
            <div className="ui input">
              <input
                type="text"
                placeholder="Bring your corgi day!"
                defaultValue={meetup.title}
                onChange={this.onTitleChange.bind(this)}
              />
            </div>
          </div>
          <div className="field required">
            <label><i className="icon pencil"></i> Description</label>
            <div className="ui input">
              <textarea
                placeholder="This is where corgi's come to pawtay!"
                defaultValue={meetup.description}
                onChange={this.onDescriptionChange.bind(this)}
              ></textarea>
            </div>
          </div>
          <div className="field required">
            <label><i className="icon marker"></i> Location</label>
            <div className="ui input">
              <input
                type="text"
                placeholder="Dockweiler Beach, CA"
                defaultValue={meetup.title}
                onChange={this.onLocationChange.bind(this)}
              />
            </div>
          </div>
          <div className="field">
            <label><i className="icon tag"></i> Tags <small>(comma separated)</small></label>
            <div className="ui input">
              <input
                type="text"
                placeholder="pets, beach, social"
                defaultValue={meetup.tags}
                onChange={this.onTagsChange.bind(this)}
              />
            </div>
          </div>
          <div className="three fields">
            <div className="field">
              <label><i className="icon photo"></i> Image</label>
              <div
                className="ui small bordered image"
                style={{
                  width: '200px',
                  height:'200px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <img src={imageUrl} alt="" />
                </div>
            </div>
            <div className="field">
              <label><i className="icon upload"></i> Image Upload</label>
              <div className="ui input">
                <input
                  type="file"
                  placeholder="Tags"
                  defaultValue={meetup.tags}
                  onChange={this.onImageChange.bind(this)}
                />
              </div>
            </div>
            <div className="field">
              <label><i className="icon world"></i> Image URL</label>
              <div className="ui input">
                <input
                  type="text"
                  placeholder="Image URL"
                  onChange={this.onImageUrlChange.bind(this)}
                />
              </div>
            </div>
          </div>
          <div className="field required">
            <label><i className="icon wait"></i> Start Date</label>
            <Datetime
              defaultValue={moment.unix(meetup.startTimestamp)}
              onChange={this.onStartDateChange.bind(this)}
            />
          </div>
          <div className="field required">
            <label><i className="icon wait"></i> End Date</label>
            <Datetime
              defaultValue={moment.unix(meetup.endTimestamp)}
              onChange={this.onEndDateChange.bind(this)}
            />
          </div>
          <div className="field">
          {isNew ?
            <button className="ui button green icon" onClick={this.handleSubmit.bind(this)}>
              Create
              <i className="icon save"></i>
            </button>
         :
            <button className="ui button green icon" onClick={this.handleEditSubmit.bind(this)}>
              Save
              <i className="icon save"></i>
            </button>
          }
          </div>
        </form>
        }
      </div>
    </div>
    )
  }

  onTitleChange(event) {
    const {meetup} = this.state
    meetup.title = event.target.value.trim()
    this.setState({meetup})
  }

  onDescriptionChange(event) {
    const {meetup} = this.state
    meetup.description = event.target.value.trim()
    this.setState({meetup})
  }

  onLocationChange(event) {
    const {meetup} = this.state
    meetup.location = event.target.value.trim()
    this.setState({meetup})
  }

  onTagsChange(event) {
    const {meetup} = this.state
    meetup.tags = event.target.value.split(',').map(x => x.trim()).join(',')
    this.setState({meetup})
  }

  onImageChange(event) {
    console.log(event)
    const file = event.target.files[0]

    uploadFile(file)
    .then(files => {
      console.log(files)

      const multihash = files[0].hash

      const {meetup} = this.state
      meetup.image = multihash
      this.setState({meetup})

      this.setState({
        imageUrl: ipfsUrl(multihash)
      })
    })
    .catch(error => {
      console.error(error)
    })
  }

  onImageUrlChange(event) {
    const url = event.target.value.trim()

    uploadFromUrl(url)
    .then(files => {
      console.log(files)

      const multihash = files[0].hash

      const {meetup} = this.state
      meetup.image = multihash

      this.setState({
        meetup,
        imageUrl: ipfsUrl(multihash)
      })
    })
    .catch(error => {
      console.error(error)
    })
  }

  onStartDateChange(momentDate) {
    const {meetup} = this.state
    meetup.startTimestamp = momentDate.unix()
    this.setState({meetup})
  }

  onEndDateChange(momentDate) {
    const {meetup} = this.state
    meetup.endTimestamp = momentDate.unix()
    this.setState({meetup})
  }

  handleSubmit(event) {
    event.preventDefault()

    getInstance()
    .createMeetup(this.state.meetup)
    .then(tx => {
      console.log(tx)
      window.location.href = '#meetups'
    })
    .catch(error => {
      console.error(error)
      alert(error)
    })
  }

  handleEditSubmit(event) {
    event.preventDefault()

    const {meetup} = this.state
    console.log(meetup)

    getInstance()
    .editMeetup(meetup)
    .then(tx => {
      console.log(tx)
      window.location.href = `#/meetup/${meetup.id}`
    })
    .catch(error => {
      console.error(error)
      alert(error)
    })
  }

  getMeetup() {
    const {id} = this.state

    return getInstance()
    .getMeetupById(id)
    .then(meetup => {
      console.log(meetup)
      this.setState({
        meetup,
        imageUrl: meetup.imageUrl
      })
    })
  }
}

module.exports = EditMeetup
