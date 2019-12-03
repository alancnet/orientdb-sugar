const { iterate, objectCriteria } = require('./util')

class Traversal {
  constructor(session, parent, expression, chainable = false, options) {
      this.session = session
      this.parent = parent
      this.expression = expression
      this.chainable = chainable
      this.options = options || parent.options
  }
  log(...args) {
      if (this.options.log) this.options.log(...args)
  }
  toString(expr) {
      if (expr) {
          if (this.chainable) {
              return this.parent.toString(`${this.expression}.${expr}`)
          } else {
              return `select distinct(*) from (select expand(${expr}) from (${this.expression}))`
          }
      } else {
          if (this.chainable) {
              return this.parent.toString(this.expression)
          } else {
              return this.expression
          }
      }
  }
  async *[Symbol.asyncIterator]() {
      const s = await this.session
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
      return new Traversal(this.session, this, `select distinct(*) from (${this.toString()}) WHERE ${objectCriteria(criteria)}`, false)
  }
  slice(start, count) {
      return new Traversal(this.session, this `${this.toString()} SKIP ${start} LIMIT ${count}`, false)
  }
}

module.exports = Traversal