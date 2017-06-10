const React = require('react')
const ReactDOM = require('react-dom')

function Comments(props) {
  window.disqus_config = function () {
    this.page.url = `https://eth.social/meetup/${props.id}`
    this.page.identifier = props.id
  }

  var d = document
  var el = d.head || d.body
  var s = d.createElement('script')
  s.src = 'https://eth-social.disqus.com/embed.js'
  s.setAttribute('data-timestamp', +new Date())
  el.appendChild(s);

  return (
    <div className="ui grid">
      <div className="sixteen column wide">
        <div id="disqus_thread"></div>
      </div>
    </div>
  )
}

module.exports = Comments
