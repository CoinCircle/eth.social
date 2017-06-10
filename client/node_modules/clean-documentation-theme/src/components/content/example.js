'use strict'

const React = require('react')
const Radium = require('radium')

const Utils = require('../../utils')

const Example = ({caption, content, utils}) => {
  let renderedCaption

  if (caption) {
    renderedCaption = (
      <p dangerouslySetInnerHTML={{__html: utils.md(caption)}} />
    )
  }

  const rendered = {
    __html: utils.highlight(content)
  }

  return (
    <div>
      <h4>Example</h4>
      {renderedCaption}
      <pre>
        <code
          dangerouslySetInnerHTML={rendered} />
      </pre>
    </div>
  )
}

Example.propTypes = {
  caption: React.PropTypes.object,
  content: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.object
  ]).isRequired,
  utils: React.PropTypes.instanceOf(Utils).isRequired
}

module.exports = Radium(Example)
