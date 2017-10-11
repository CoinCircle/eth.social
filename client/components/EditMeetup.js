const React = require('react')
const ReactDOM = require('react-dom')
const moment = require('moment')
const Datetime = require('react-datetime')

const Spinner = require('./Spinner.js')
const {getInstance} = require('../services/contract')
const {ipfsUrl, uploadJson, uploadFile, uploadFromUrl} = require('../services/ipfs')
const {DEFAULT_MEETUP_IMAGE} = require('../constants/defaults')

const defaultMeetup = {
  title: '',
  description: '',
  location: '',
  tags: [],
  image: '',
  start: moment().add(1, 'day').startOf('hour').unix(),
  end: moment().add(1, 'day').add(4, 'hour').startOf('hour').unix(),
  created: moment().unix(),
  updated: null,
  organizer: ''
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

      this.getMeetup()
      .then(() => {})
      .catch(() => {
        window.location.href = '#/'
      })
      .then(() => {
        this.setState({showSpinner: false})
      })
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
        <div className="sub header">
          <p>Please make sure you have your MetaMask wallet connected.</p>
        </div>
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
                defaultValue={meetup.tags.join(',')}
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
              defaultValue={moment.unix(meetup.start)}
              onChange={this.onStartDateChange.bind(this)}
            />
          </div>
          <div className="field required">
            <label><i className="icon wait"></i> End Date</label>
            <Datetime
              defaultValue={moment.unix(meetup.end)}
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
    meetup.tags = event.target.value.split(',').map(x => x.trim())
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
    meetup.start = momentDate.unix()
    this.setState({meetup})
  }

  onEndDateChange(momentDate) {
    const {meetup} = this.state
    meetup.end = momentDate.unix()
    this.setState({meetup})
  }

  async handleSubmit(event) {
    event.preventDefault()

    const {meetup} = this.state
    meetup.created = moment().unix()
    meetup.organizer = getInstance().account

    if (!meetup.title) {
      alert('Title is required')
      return false
    }

    const [result] = await uploadJson(meetup)
    const {hash:ipfsHash} = result

    try {
      await getInstance().createMeetup({ipfsHash})
      window.location.href = '#meetups'
    } catch (error) {
      alert(error)
    }
  }

  async handleEditSubmit(event) {
    event.preventDefault()

    const {meetup} = this.state
    meetup.updated = moment().unix()

    if (!meetup.title) {
      alert('Title is required')
      return false
    }

    const {id} = meetup
    meetup.organizer = getInstance().account

    const [result] = await uploadJson(meetup)
    const {hash:ipfsHash} = result

    try {
      await getInstance().editMeetup({id, ipfsHash})
      window.location.href = `#/meetups/${id}`
    } catch (error) {
      alert(error)
    }
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
