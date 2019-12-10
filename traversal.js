const nest = require('nest-literal')
const { iterate, objectCriteria } = require('./util')

class Traversal {
  constructor(options) {
    if (!options.session) throw new Error('Session required')
    this.options = options
    this._statement = this._statement.bind(this)
  }
  log(...args) {
    if (this.options.log) this.options.log(...args)
  }
  toString() {
    return this._statement().toString()
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
  _next(type, expression, options) {
    return new type({
      expression,
      session: this.options.session,
      parent: this,
      ...options
    })
  }
  /** @return {this} */
  where(criteria) {
    return this._next(this.constructor, nest`select distinct(*) from (${this._statement}) WHERE ${objectCriteria(criteria)}`)
  }
  /** @return {this} */
  slice(start, count) {
    return this._next(this.constructor, nest`${this._statement} SKIP ${start} LIMIT ${count}`)
  }
  /** @return {this} */
  select(fields) {
    return this._next(this.constructor, nest`select ${fields.map(escapeField).join(', ')} from (${this._statement})`, { terminal: true })
  }
}

module.exports = Traversal