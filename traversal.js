const nest = require('nest-literal')
const { iterate, objectCriteria } = require('./util')

class Traversal {
  constructor(options) {
    this.options = options
    this._statement = this._statement.bind(this)
  }
  log(...args) {
    if (this.options.log) this.options.log(...args)
  }
  toString(expr) {
    if (expr) {
      if (this.options.chainable) {
        return this.options.parent.toString(`${this.options.expression}.${expr}`)
      } else {
        return `select distinct(*) from (select expand(${expr}) from (${this.options.expression}))`
      }
    } else {
      if (this.options.chainable) {
        return this.options.parent.toString(this.options.expression)
      } else {
        return this.options.expression
      }
    }
  }
  _statement(expr) {
    if (expr) {
      if (this.options.chainable) {
        return this.options.parent._statement(nest`${this.options.expression}.${expr}`)
      } else {
        return nest`select distinct(*) from (select expand(${expr}) from (${this.options.expression}))`
      }
    } else {
      if (this.options.chainable) {
        return this.options.parent._statement(this.options.expression)
      } else {
        return this.options.expression
      }
    }
  }
  async *[Symbol.asyncIterator]() {
    const s = await this.options.session
    const query = this.toString()
    this.log(query)
    yield* iterate(s.query(query))
  }
  async toArray() {
    let ret = []
    for await (let record of this) {
      ret.push(record)
    }
    return ret
  }
  async one() {
    return (await this.toArray())[0]
  }
  next() {
    return this
  }
  limit() {
    return this.next()
  }
  where(criteria) {
    return new Traversal({ parent: this, expression: nest`select distinct(*) from (${this._statement}) WHERE ${objectCriteria(criteria)}`, chainable: false })
  }
  slice(start, count) {
    return new Traversal({ parent: this, expression: nest`${this._statement} SKIP ${start} LIMIT ${count}`, chainable: false})
  }
  select(fields) {
    return new Traversal({ parent: this, expression: nest`select ${fields.map(escapeField).join(', ')} from (${this._statement})`, chainable: false, terminal: true })
  }
}

module.exports = Traversal