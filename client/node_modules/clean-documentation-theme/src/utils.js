'use strict'

const GithubSlugger = require('github-slugger')
const hljs = require('highlight.js')
const util = require('documentation').util
const createFormatters = util.createFormatters
const createLinkerStack = util.createLinkerStack
const _ = require('lodash')

module.exports = class Utils {
  constructor (options, comments) {
    this.linkerStack = createLinkerStack(options)
      .namespaceResolver(comments, (namespace) => {
        const slugger = new GithubSlugger()
        return '#' + slugger.slug(namespace)
      })

    this.options = options
    this.comments = comments
    this.formatters = createFormatters(this.linkerStack.link)
    this.options.hljs = this.options.hljs || {}

    hljs.configure(this.options.hljs)

    this.formatType = this.formatters.type
    this.autolink = this.formatters.autolink
  }

  md (ast, inline) {
    if (inline && ast && ast.children.length && ast.children[0].type === 'paragraph') {
      ast = {
        type: 'root',
        children: ast.children[0].children.concat(ast.children.slice(1))
      }
    }
    return this.formatters.markdown(ast)
  }

  highlight (code) {
    if (this.options.hljs && this.options.hljs.highlightAuto) {
      return hljs.highlightAuto(code).value
    }
    return hljs.highlight('js', code).value
  }

  signature (section) {
    let returns = ''
    let prefix = ''

    if (section.kind === 'class') {
      prefix = 'new '
    } else if (section.kind !== 'function') {
      const type = getType(section)
      if (type) {
        return `${section.name}: ${this.formatType(type)}`
      }

      return section.name
    }

    if (section.returns) {
      returns = `: ${this.formatType(section.returns[0].type)}`
    }

    return prefix + section.name + this.formatters.parameters(section) + returns
  }

  slug (str) {
    const slugger = new GithubSlugger()
    return slugger.slug(str)
  }
}

function getType (section) {
  if (!section.tags) {
    return
  }

  const tag = _.find(section.tags, (tag) => tag.title === 'type')

  if (!tag) {
    return
  }

  return tag.type
}
