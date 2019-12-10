const nest = require('nest-literal')
const { iterate, objectCriteria, escapeField } = require('./util')
const ORidBag = require('orientjs/lib/client/database/bag').ORidBag
const { RecordID } = require('orientjs')
const { link } = require('./json')

/**
 * Represents a traversal
 */
class Traversal {
  constructor(options) {
    if (!options.session) throw new Error('Session required')
    this.options = options
    this._statement = this._statement.bind(this)
  }
  log(...args) {
    if (this.options.log) this.options.log(...args)
  }
  /**
   * Produces a SQL string
   */
  toString() {
    return this._statement().toString()
  }
  _statement(expr) {
    if (expr) {
      if (this.options.chainable) {
        return this.options.parent._statement(nest`${this.options.expression}.${expr}`)
      } else {
        return nest`select distinct(*) from (select expand(${expr}) from (${this}))`
      }
    } else {
      if (this.options.chainable) {
        return this.options.parent._statement(this.options.expression)
      } else {
        return this.options.expression
      }
    }
  }

  async *[Symbol.asyncIterator]({explain = false} = {}) {
    const statement = this._statement()

    const dive = async function*(st, terminal) {
      for (let [i, sub] of st.substitutions.entries()) {
        const isTraversal = sub instanceof Traversal
        const isNest = !!(sub.callSite && sub.substitutions)
        const isTerminal = !!(isTraversal && sub.options.terminal)
        if (isTraversal || isNest) {
          // Yield any results from nested queries
          const iterator = dive(isTraversal ? sub._statement() : sub, isTerminal)
          let result
          do {
            result = await iterator.next()
            if (!result.done) {
              yield result.value
            }
          } while (!result.done)
          // No results found in a subquery. Shortcut to exit.
          if (result.value === null) return null
          st.substitutions[i] = result.value
        }
      }
      if (terminal) {
        if (explain) {
          yield st.toString()
          return ':results'
        }
        let rids = []
        const s = await this.options.session
        const query = st.toString()
        this.log(query)
        for await (let record of iterate(s.query(query))) {
          yield record
          console.log(record)
          if (record && record['@rid']) rids.push(record['@rid'])
        }
        return rids.length ? nest`select from [${rids}]` : null
      } else {
        return st
      }
    }.bind(this)

    yield* dive(statement, true)
  }

  execute(opts) {
    return this[Symbol.asyncIterator](opts)
  }
  /**
   * Produce an array of SQL statements that will be executed to fulfill this traversal.
   * @return {Array.<string>}
   */
  async explain() {
    return await this.execute({explain: true}).toArray()
  }

  /**
   * Replace Record IDs with their corresponding records, so that the graph is easily traversible in code.
   * @return {Array.<any>}
   */
  async link() {
    const records = await this.execute().toArray()
    return link(records)
  }

  /**
   * Collect all results into a single array.
   * @return {Array.<any>}
   */
  async toArray() {
    let ret = []
    for await (let record of this) {
      ret.push(record)
    }
    return ret
  }

  /**
   * Returns the first record, if a record is returned.
   */
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
  /**
   * Filter results by a MongoDB-like query object.
   * @return {this}
   */
  where(criteria) {
    return this._next(this.constructor, nest`select from (${this}) where ${objectCriteria(criteria)}`)
  }
  /**
   * For pagination, skip to a subset of records.
   * @param {number} start How many records to skip.
   * @param {number} count How many records to return.
   * @return {this}
   */
  slice(start, count) {
    return this._next(this.constructor, nest`${this} skip ${start} limit ${count}`)
  }
  /**
   * Pick columns to return and/or emit records thus far in a multi-step traversal.
   * @param {Array.<string>} fields The field names to return.
   * @return {this}
   */
  select(fields) {
    if (fields && !fields.includes('@rid')) fields = ['@rid', ...fields]
    return this._next(this.constructor, fields ? nest`select ${fields.map(escapeField).join(', ')} from (${this})` : nest`select from (${this})`, { terminal: true })
  }
}

module.exports = Traversal