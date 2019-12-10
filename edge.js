const { track, escapeObj, whatChanged, toRid, toRidArray } = require('./util')

const Class = require('./class')
const EdgeTraversal = require('./edge-traversal')

/**
 * @implements {Promise<Edge>}
 */
class Edge extends Class {
  constructor(session, name, options) {
    super(session, name, options)
    this.type = 'EDGE'
  }
  /**
   * Creates a new class in the schema.
   * @param {string} base Optional base class
   */
  extends(base) {
    super.extends(base || 'E')
    return this
  }
  /**
   * Creates a new property in the schema. It requires that the class for the property already exist on the database.
   * @param {string} name Defines the logical name for the property.
   * @param {string} type Defines the property data type.
   */
  property(name, type) {
    super.property(name, type)
    return this
  }
  /**
   * Ensures an index exists. If the index already exists, this will not overwrite or reconfigure it.
   * @param {string[]} properties Array of properties to include in the index
   * @param {string} type Defines the index type that you want to use.
   * @param {string} name Optional. Specify the name of the index.
   */
  index(properties, type, name) {
    super.index(properties, type, name)
    return this
  }

  /**
   * Inserts an edge record.
   * @param {Reference} from Source record
   * @param {Reference} to Target record
   * @param {object} data Edge record data
   * @returns {Record}
   */
  async insert(from, to, data = {}) {
    const s = await this.session
    return await track(() => s.create('EDGE', this.name).from(toRid(from)).to(toRid(to)).set(escapeObj(data)).one())
  }
  /**
   * Ensures an edge exists, and updates its data.
   * @param {Reference} from Source record
   * @param {Reference} to Target record
   * @param {object} data Edge record data
   * @returns {Record}
   */
  async upsert(from, to, data = {}) {
    from = from['@rid'] || from
    to = to['@rid'] || to
    const s = await this.session
    let record = await this.get({ out: from, in: to })
    if (record) {
      const changed = whatChanged(record, data)
      if (changed) {
        await track(() => s.update(record['@rid']).set(escapeObj(changed)).one())
        record = { ...record, ...changed }
      }
    } else {
      record = await track(() => s.create('EDGE', this.name).from(toRid(from)).to(toRid(to)).set(escapeObj(data)).one())
    }
    return record
  }

  /**
   * Begins traversal with records
   * @param {Reference} reference 
   */
  traverse(record) {
    const rids = toRidArray(record)
    if (rids) {
      return new EdgeTraversal({ parent: null, expression: `select distinct(*) from [${rids.join(', ')}]`, chainable: false })
    } else {
      return new EdgeTraversal({ parent: null, expression: `select distinct(*) from ${this.name}`, chainable: false })
    }
  }
}

module.exports = Edge