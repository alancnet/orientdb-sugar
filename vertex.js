const nest = require('nest-literal')
const { track, escapeObj, escapeField, whatChanged, toRidArray } = require('./util')

const Class = require('./class')
const VertexTraversal = require('./vertex-traversal')

/**
 * Represents a Vertex Class in the schema.
 * @implements {Promise<Vertex>}
 */
class Vertex extends Class {
  constructor(session, name, options) {
    super(session, name, options)
    this.type = 'VERTEX'
  }
  /**
   * Creates a new class in the schema.
   * @param {string} base Optional base class
   */
  extends(base) {
    super.extends(base || 'V')
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
   * Inserts a vertex record
   * @param {object} data
   * @returns {Record}
   */
  async insert(data) {
    const s = await this.session
    return await track(() => s.create('VERTEX', this.name).set(escapeObj(data)).one())
  }
  /**
   * Creates or updates a vertex. The resulting vertex would be a combination of query and data.
   * @param {name} name Name of the class
   * @param {object} query Object containing identifier of the vertex.
   * @param {object} data Additional properties of the vertex.
   */
  async upsert(query, data = {}) {
    const s = await this.session
    let record = await track(() => s.select().from(escapeField(this.name)).where(escapeObj(query)).one())
    if (record) {
      const changed = whatChanged(record, data)
      if (changed) {
        await track(() => s.update(record['@rid']).set(escapeObj(changed)).one())
        record = { ...record, ...changed }
      }
    } else {
      record = await track(() => s.create('VERTEX', this.name).set(escapeObj({ ...query, ...data })).one())
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
      return new VertexTraversal({ session: this.session, parent: null, expression: nest`select distinct(*) from [${rids.join(', ')}]`, chainable: false })
    } else {
      return new VertexTraversal({ session: this.session, parent: null, expression: nest`select distinct(*) from ${escapeField(this.name)}`, chainable: false })
    }
  }
}

module.exports = Vertex