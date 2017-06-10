'use strict';

exports.lineHeight = function () {
  var n = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
  return n * 26 + 'px';
};

exports.monoFont = 'Roboto Mono, Menlo, Monaco, Courier, monospace';
// exports.serifFont = 'Roboto Slab, serif'
exports.sansSerifFont = 'Roboto, sans-serif';

exports.textColor = '#000'; // '#5b6888'
exports.lightGray = '#e6e9ed';

exports.contentStyles = {
  'h1, h2, h3, h4, h5, h6': {
    fontFamily: exports.sansSerifFont,
    fontWeight: 300
  },
  h1: {
    fontSize: '48px',
    lineHeight: '72px'
  },
  h2: {
    fontSize: '24px',
    lineHeight: '36px'
  },
  h3: {
    fontSize: '19px',
    lineHeight: '29px',
    fontWeight: 400
  },
  h4: {
    fontSize: '17px',
    lineHeight: '22px',
    fontWeight: 400
  },
  a: {
    textDecoration: 'none',
    color: '#00AAFF',
    ':hover': {
      cursor: 'pointer'
    }
  },
  'a.anchor:before': {
    content: '""',
    display: 'block',
    height: '100px',
    margin: '-80px 0 0'
  },
  '.content blockquote': {
    paddingLeft: '20px',
    margin: 0,
    borderLeft: '4px solid #eee'
  },
  '.content ul, content li': {
    listStyle: 'none'
  },
  '.content ul li:before': {
    color: '#CCC',
    float: 'left',
    marginLeft: '-20px',
    marginTop: '1px',
    content: '"•"'
  },
  'pre.hljs, pre > code': {
    fontFamily: exports.monoFont,
    display: 'block',
    padding: '12px 15px 12px 15px',
    borderRadius: '4px',
    boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.1)',
    marginBottom: '30px',
    position: 'relative',
    overflowX: 'auto',
    fontSize: '13px',
    color: '#666',
    whiteSpace: 'pre'
  },
  code: {
    fontFamily: exports.monoFont,
    display: 'inline',
    fontSize: '13px',
    fontWeight: 400,
    margin: '0 2px',
    padding: '1px 6px',
    boxShadow: '0 0 0 1px #DDD',
    whiteSpace: 'nowrap',
    borderRadius: '4px'
  },
  // Highlightjs Theme
  '.hljs': {
    display: 'block',
    overflowX: 'auto'
  },
  '.hljs-comment, .hljs-quote': {
    color: '#998',
    fontStyle: 'italic'
  },
  '.hljs-keyword, .hljs-selector-tag, .hljs-subst': {
    color: '#333',
    fontWeight: 'bold'
  },
  '.hljs-number, .hljs-literal, .hljs-variable, .hljs-template-variable, .hljs-tag .hljs-attr': {
    color: '#008080'
  },
  '.hljs-string, .hljs-doctag': {
    color: '#d14'
  },
  '.hljs-title, .hljs-section, .hljs-selector-id': {
    color: '#900',
    fontWeight: 'bold'
  },
  '.hljs-subst': {
    fontWeight: 'normal'
  },
  '.hljs-type, .hljs-class .hljs-title': {
    color: '#458',
    fontWeight: 'bold'
  },
  '.hljs-tag, .hljs-name, .hljs-attribute': {
    color: '#000080',
    fontWeight: 'normal'
  },
  '.hljs-regexp, .hljs-link': {
    color: '#009926'
  },
  '.hljs-symbol, .hljs-bullet': {
    color: '#990073'
  },
  '.hljs-built_in, .hljs-builtin-name': {
    color: '#0086b3'
  },
  '.hljs-meta': {
    color: '#999',
    fontWeight: 'bold'
  },
  '.hljs-deletion': {
    background: '#fdd'
  },
  '.hljs-addition': {
    background: '#dfd'
  },
  '.hljs-emphasis': {
    fontStyle: 'italic'
  },
  '.hljs-strong': {
    fontWeight: 'bold'
  }
};