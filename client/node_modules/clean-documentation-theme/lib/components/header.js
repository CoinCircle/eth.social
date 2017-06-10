'use strict';

var React = require('react');
var Radium = require('radium');

var _require = require('radium-bootstrap-grid'),
    Container = _require.Container,
    Row = _require.Row,
    Column = _require.Column;

var Octocat = require('react-icons/lib/go/mark-github');
var BookIcon = require('react-icons/lib/go/book');

var _require2 = require('./styles'),
    monoFont = _require2.monoFont,
    sansSerifFont = _require2.sansSerifFont,
    lineHeight = _require2.lineHeight;

var Title = Radium(function (_ref) {
  var value = _ref.value;

  var style = {
    textTransform: 'uppercase',
    fontFamily: sansSerifFont
  };

  return React.createElement(
    'div',
    { style: style },
    value
  );
});

var Version = Radium(function (_ref2) {
  var value = _ref2.value;

  var style = {
    fontFamily: monoFont,
    fontWeight: 300
  };

  return React.createElement(
    'div',
    { style: style },
    value
  );
});

var Header = function Header(_ref3) {
  var name = _ref3.name,
      version = _ref3.version,
      project = _ref3.project;

  var style = {
    boxShadow: '0px 2px 3px 0px rgba(0, 0, 0, 0.25)',
    height: lineHeight(2.5),
    width: '100%',
    minWidth: '100%',
    marginLeft: '0',
    marginRight: '0',
    position: 'fixed',
    zIndex: 99,
    background: '#FFFFFF',
    paddingTop: '10px',
    paddingBottom: '10px',
    paddingLeft: '20px',
    paddingRight: '20px'
  };

  var projectLink = null;

  var projectLinkStyle = {
    textAlign: 'right',
    float: 'right !important',
    fontSize: '36px'
  };

  if (project) {
    projectLink = React.createElement(
      Column,
      { md: 3, xs: 3, style: projectLinkStyle },
      React.createElement(
        'a',
        { href: project },
        React.createElement(Octocat, null)
      )
    );
  }
  var logoStyle = {
    fontSize: '36px',
    verticalAlign: 'inherit',
    marginRight: '20px'
  };

  var titleStyle = {
    display: 'inline-block'
  };

  return React.createElement(
    'div',
    { style: style },
    React.createElement(
      Container,
      null,
      React.createElement(
        Row,
        null,
        React.createElement(
          Column,
          { md: 6, xs: 6 },
          React.createElement(BookIcon, { style: logoStyle }),
          React.createElement(
            'div',
            { style: titleStyle },
            React.createElement(Title, { value: name }),
            React.createElement(Version, { value: version })
          )
        ),
        projectLink
      )
    )
  );
};

module.exports = Radium(Header);