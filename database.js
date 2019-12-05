const { toRid, toRidArray } = require('./util')
const gefer = require('gefer')

const Class = require('./class')
const Vertex = require('./vertex')
const Edge = require('./edge')

class Database {
  constructor(session, options) {
    this.session = session
    this.options = options
  }
  /**
   * Execute SQL as a template.
   * 
   * @example await db.sql`SELECT FROM User WHERE name = ${myName}`.toArray()
   * @example for await (let record of db.sql`SELECT FROM User WHERE name = ${myName}`)
   * @returns {AsyncIterable.<*>}
   */
  async * sql(template, ...args) {
    if (typeof template === 'string') throw new Error(`.sql() is meant to be used as a string template, not called as a function directly.`)
    let p = 0
    let sql = []
    const params = {}
    for (let i = 0; i < template.length; i++) {
      if (i) {
        const pname = `p${p++}`
        sql.push(`:${pname}`)
        params[pname] = args[i - 1]
      }
      sql.push(template[i])
    }
    yield* this.query(sql.join(''), { params })
  }

  /**
   * Execute Raw SQL.
   * @param {string} queryText Raw SQL
   * @param {object} options Query options
   * @param {object} options.params Query parameters
   * @returns {AsyncIterable.<*>}
   * @example await db.query('SELECT FROM User WHERE name = :p1', {params: {p1: 'Tom Hanks'}}).toArray()
   */
  async * query(queryText, options) {
    const subject = gefer.subject()
    const s = await this.session
    s.query(queryText, options)
      .on('data', subject.next)
      .on('error', subject.error)
      .on('end', subject.return)
    yield* subject()
  }

  /**
   * Execute Raw SQL.
   * @param {string} queryText Raw SQL
   * @param {object} options Query options
   * @param {object} options.params Query parameters
   * @returns {AsyncIterable.<*>}
   * @example await db.query(`INSERT INTO User SET name = ${name}`).toArray()
   */
  async * command(queryText, options) {
    const subject = gefer.subject()
    const s = await this.session
    s.command(queryText, options)
      .on('data', subject.next)
      .on('error', subject.error)
      .on('end', subject.return)
    yield* subject()
  }

  /**
   * Inserts a regular record.
   * @param {string} name Name of the class / table
   * @param {object} record Record data
   * @returns {object} The inserted record
   * @example await db.insert('User', {name: 'Tom Hanks'})
   * @returns {Record}
   */
  async insert(name, record) {
    return await new Class(this.session, name, this.options).insert(record)
  }
  /**
   * Inserts a vertex record.
   * @param {string} name Name of the vertex class
   * @param {object} data Record data
   * @returns {object} The inserted record
   * @example await db.insert('User', {name: 'Tom Hanks'})
   * @returns {Record}
   */
  async insertVertex(name, data) {
    return await this.vertex(name).insert(data)
  }
  /**
   * Inserts an edge record.
   * @param {string} name Name of the edge class
   * @param {Reference} from Record edge comes out of / from
   * @param {Reference} to Record edge goes into / to
   * @param {object} data Record data
   * @returns {object} The inserted record
   * @example await db.insert('User', {name: 'Tom Hanks'})
   * @returns {Record}
   */
  async insertEdge(name, from, to, data = {}) {
    return await this.edge(name).insert(from, to, data)
  }
  /**
   * Gets a single record
   * @param {String} name Name of the class
   * @param {Reference} reference Record to get
   * @returns {Record}
   */
  async get(name, reference) {
    return await new Class(this.session, name, this.options).get(reference)
  }

  /**
   * Gets multiple records
   * @param {string} name Name of the class
   * @param {Reference} reference Records to get
   * @returns {AsyncIterator.<Record>}
   */
  async* select(name, reference) {
    yield* new Class(this.session, name, this.options).select(reference)
  }

  /** 
   * Updates records
   * @param {string} name Name of the class
   * @param {Reference} reference Records to update
   * @param {object} data Data to update
   */
  async update(name, reference, data) {
    if (!data || !Object.values(data).filter(x => x !== undefined).length) throw new Error('Update requires changes')
    return await new Class(this.session, name, this.options).update(reference, data)
  }

  /**
   * Creates or updates a record. The resulting record would be a combination of query and data.
   * @param {name} name Name of the class
   * @param {object} query Object containing identifier of the record.
   * @param {object} data Additional properties of the record.
   */
  async upsert(name, query, data = {}) {
    return await new Class(this.session, name, this.options).upsert(query, data)
  }

  /**
   * Creates or updates a single Vertex. *Important* The first property is assumed to be the identifier.
   * @param {object} object An object with a @class property, or a single PascalCased object property naming the class.
   * @example await upsertVertexObject({ User: { id: 123, name: 'Tom Hanks' }})
   * @example await upsertVertexObject({ '@class': 'User', id: 123, name: 'Tom Hanks' })
   * @returns {Record}
   */
  async upsertVertexObject(object) {
    object = { ...object }
    let name
    const keys = Object.keys(object)
    if (object['@class']) {
      name = object['@class']
      delete object['@class']
    } else if (keys.length === 1 && keys[0].substr(0, 1) === keys[0].substr(0, 1).toUpperCase()) {
      name = keys[0]
      object = object[name]
    } else {
      throw new Error('upsertVertexObject needs an object with a @class property, or a single PascalCased object property naming the class.')
    }
    const entries = Object.entries(object)
    const query = Object.fromEntries(entries.slice(0, 1))
    const data = Object.fromEntries(entries.slice(1))
    return await this.upsertVertex(name, query, data)
  }
  /**
   * Creates or updates an edge. *Important* the `out` and `in` properties are assumed to be a compound key.
   * @param {object} object An object with a @class property, or a single PascalCased object property naming the class.
   * @param {Reference} from Record edge comes out of / from
   * @param {Reference} to Record edge goes into / to
   */
  async upsertEdgeObject(object, from, to) {
    object = { ...object }
    let name
    const keys = Object.keys(object)
    if (object['@class']) {
      name = object['@class']
      delete object['@class']
    } else if (keys.length === 1 && keys[0].substr(0, 1) === keys[0].substr(0, 1).toUpperCase()) {
      name = keys[0]
      object = object[name]
    } else {
      throw new Error('upsertEdgeObject needs an object with a @class property, or a single PascalCased object property naming the class.')
    }
    from = from || toRid(await object.from)
    to = to || toRid(await object.to)
    if (!from || !to) throw new Error(`upsertEdgeObject missing from/to`)
    const data = { ...object }
    delete data.from
    delete data.to
    return await this.upsertEdge(name, from, to, data)
  }
  /**
   * Creates or updates a vertex. The resulting record would be a combination of query and data.
   * @param {name} name Name of the vertex
   * @param {object} query Object containing identifier of the record.
   * @param {object} data Additional properties of the record.
   */
  async upsertVertex(name, query, data) {
    if (typeof name === 'object') return await this.upsertVertexObject(name)
    return await this.vertex(name).upsert(query, data)
  }
  /**
   * Creates or updates an edge. The resulting record would be a combination of query and data.
   * @param {name} name Name of the edge
   * @param {object} query Object containing identifier of the record.
   * @param {Reference} from Record edge comes out of / from
   * @param {Reference} to Record edge goes into / to
   * @param {object} data Additional properties of the edge.
   */
  async upsertEdge(name, from, to, data = {}) {
    if (typeof name === 'object') return await this.upsertEdgeObject(name)
    return await this.edge(name).upsert(from, to, data)
  }
  /**
   * Store basic knowledge by upserting vertices and edges
   * @param {(object|Array.<object>)} from An object with a @class property, or a single PascalCased object property naming the class.
   * @param {(string|object|Array.<string>|Array.<object>)} edge Edge class name, or an object with a @class property, or a single PascalCased object property naming the class.
   * @param {(object|Array.<object>)} to An object with a @class property, or a single PascalCased object property naming the class.
   * @param {object} data Additional properties for the edge
   * 
   * @example
   *   await db.learn(
   *       { Actor: { name: 'Jared Rushton' }},
   *       'ActedIn',
   *       { Film: { name: 'Big'}}
   *   )
   * @example
   *   await db.learn(
   *       { Actor: { name: 'Jared Rushton' }},
   *       ['ActedIn', 'CostarredIn'],
   *       { Film: { name: 'Big'}},
   *       { character: 'Billy' }
   *   )
   */
  async learn(from, edge, to, data) {
    if (!Array.isArray(from)) from = [from]
    if (!Array.isArray(to)) to = [to]
    if (!Array.isArray(edge)) edge = [edge]
    from = toRidArray(await Promise.all(from.map(obj => obj['@rid'] ? obj['@rid'] : this.upsertVertexObject(obj))))
    to = toRidArray(await Promise.all(to.map(obj => obj['@rid'] ? obj['@rid'] : this.upsertVertexObject(obj))))
    const edges = []
    for (let fromRid of from) {
      for (let toRid of to) {
        for (let edgeDef of edge) {
          if (typeof edgeDef === 'string') edgeDef = this.edge(edgeDef)
          if (typeof edgeDef === 'object' && !(edgeDef instanceof Edge)) {
            if (data) throw new Error('Learn requires an edge object, or an edge class plus data. Not both.')
            edges.push(await this.upsertEdgeObject(edgeDef, fromRid, toRid))
          } else {
            edges.push(await edgeDef.upsert(fromRid, toRid, data))
          }
        }
      }
    }
    return edges
  }
  /**
   * References a class. If manageSchema is true, ensures the class exists.
   * @param {string} name Name of class
   * @param {(Class|string)} base Base class
   */
  class(name, base) {
    return new Class(this.session, name, this.options).extends(base)
  }
  /**
   * References a vertex class. If manageSchema is true, ensures the class exists.
   * @param {string} name 
   * @param {(Vertex|string)} base Base vertex class
   */
  vertex(name, base) {
    return new Vertex(this.session, name, this.options).extends(base)
  }
  /**
   * References an edge class. If manageSchema is true, ensures the class exists.
   * @param {string} name 
   * @param {(Edge|string)} base Base edge class
   * @returns {Edge}
   */
  edge(name, base) {
    return new Edge(this.session, name, this.options).extends(base)
  }
  /**
   * Begins a traversal at the specified vertices
   * @param {Reference} reference 
   * @return {VertexTraversal}
   */
  v(reference) {
    return new Vertex(this.session, 'V', this.options).traverse(reference)
  }
  /**
   * Begins a traversal at the specified edges
   * @param {Reference} reference
   * @returns {EdgeTraversal}
   */
  e(reference) {
    return new Edge(this.session, 'E', this.options).traverse(reference)
  }
}

module.exports = Database