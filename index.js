const gefer = require('gefer')
const {AsyncGenerator} = require('generator-extensions')
const {OrientDBClient, RecordID} = require('orientjs')
const _ = require('lodash')

const escapeObj = obj => Object.fromEntries(Object.entries(obj).map(([key, value]) => [key.startsWith('`') ? key : '`' + key + '`', value]))

const track = async fn => {
    const stack = new Error('at...').stack
    try {
        return await fn()
    } catch (err) {
        err.stack += stack
        throw err
    }
}

const promisify = obj => {
    obj.then = (resolved, rejected) => {
        obj.then = null
        obj.session.then(
            () => resolved(obj),
            rejected
        )
    }
    return obj
}

const iterate = async function*(result) {
    const subject = gefer.subject()
    result
        .on('data', subject.next)
        .on('error', subject.error)
        .on('end', subject.return)
    yield* subject()
}

const one = async (iterator) => {
    for await (let item of iterator) return item
}

const whatChanged = (record, data) => {
    const changed = Object.entries(data).filter(([key, value]) => !_.eq(value, record[key]))
    if (changed.length) return Object.fromEntries(changed)
    else return null
}

const toRid = (record) => {
    if (record instanceof RecordID) return record.toString()
    if (record && record['@rid']) return record['@rid'].toString()
    if (typeof record === 'string') return record
}

const toRidArray = (records) => {
    if (!records) return null
    if (Array.isArray(records)) return records.map(toRid)
    return toRidArray([records])
}

const parens = (arr, delim) => {
    if (arr.length === 1) return arr[0]
    return `(${arr.join(delim)})`
}
const groups = {
    $and: (v) => parens(v.map(objectCriteria), ' AND '),
    $or: (v) => parens(v.map(objectCriteria), ' OR ')
}
const ops = {
    $eq: (f, v) => `\`${f}\` = ${JSON.stringify(v)}`,
    $ne: (f, v) => `\`${f}\` != ${JSON.stringify(v)}`,
    $gt: (f, v) => `\`${f}\` > ${JSON.stringify(v)}`,
    $gte: (f, v) => `\`${f}\` >= ${JSON.stringify(v)}`,
    $lt: (f, v) => `\`${f}\` < ${JSON.stringify(v)}`,
    $lte: (f, v) => `\`${f}\` <= ${JSON.stringify(v)}`,
    $in: (f, v) => `\`${f}\` in ${JSON.stringify(v)}`,
    $nin: (f, v) => `\`${f}\` not in ${JSON.stringify(v)}`
}

const querify = (v) => (v instanceof RecordID || typeof v === 'string' || v[Symbol.iterator]) ? {'@rid': toRidArray(v)} : v

const objectCriteria = (obj) => {
    if (Object.keys(obj).some(x => x.startsWith('$'))) {
        return parens(Object.entries(obj).map(([key, value]) => {
            if (!key.startsWith('$')) throw new Error('Cannot mix directives with fields')
            return groups[key](value)
        }), ' AND ')
    } else {
        return parens(Object.entries(obj).map(([field, value]) => {
            if (value && Object.keys(value).some(x => x.startsWith('$'))) {
                return parens(Object.entries(value).map(([key, value]) => {
                    if (!key.startsWith('$')) throw new Error('Cannot mix directives with fields')
                    return ops[key](field, value)
                }), ' AND ')
            } else {
                return ops.$eq(field, value)
            }
        }), ' AND ')
    }
}

class Client {
    /**
     * 
     * @param {object} options Connection options
     * @param {string} options.host Hostname
     * @param {string} options.port Port
     * @param {string} options.database Database name
     * @param {string} options.username Username
     * @param {string} options.password Password
     * @param {boolean} options.manageSchema Enables the client to create classes, properties, and indices. 
     */
    constructor(options) {
        this.client = OrientDBClient.connect({
            host: options.host,
            port: options.port,
            logger: options.log ? {
                debug: options.log
            } : null
        })
        this.options = options
    }
    /**
     * 
     * @param {string} name Database name, defaults to database specified in client options. Will create database if manageSchema is true.
     * @param {object} options 
     * @param {string} options.username Username
     * @param {string} options.password Password
     */
    db(name, options = this.options) {
        if (!name) name = name || options.database || options.name
        const creds = {
            name,
            username: options.username || this.options.username,
            password: options.password || this.options.password
        }
        const session = this.client.then(async client => {
            if (this.options.manageSchema && !await client.existsDatabase(creds)) {
                await client.createDatabase(creds)
            }
            return await client.session(creds)
        })

        return new Database(session, {
            ...options,
            manageSchema: this.options.manageSchema,
            log: this.options.log,
            schema: {}
        })
    }
    async close() {
        return (await this.client).close()
    }
}

/**
 * @typedef Record
 * @property {(string|RecordID)} @rid
 * @property {('VERTEX'|'EDGE'|null)} @type
 */

/**
 * @typedef {(string|RecordID|Record|Array.<string>|Array.<RecordID>|Array.<Record>)} Reference
 */

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
        yield* this.query(sql.join(''), {params})
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
        object = {...object}
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
        object = {...object}
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
        const data = {...object}
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
    async learn (from, edge, to, data) {
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
     * @returns {Vertex}
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

/**
 * @extends {Promise<Class>}
 */
class Class {
    constructor(session, name, options) {
        this.name = name
        this.options = options
        if (this.options.schema[this.name]) {
            this.session = this.options.schema[this.name].promise.then(session)
        } else {
            this.session = session
        }
        this.type = null
        promisify(this)
    }

    log(...args) {
        if (this.options.log) this.options.log(...args)
    }

    /**
     * Creates a new class in the schema.
     * @param {string} base Optional base class
     */
    extends(base) {
        if (this.options.manageSchema) {
            if (!this.options.schema[this.name]) {
                this.options.schema[this.name] = {
                    promise: this.session.then(async s => {
                        const sql = `create class ${this.name} if not exists${base ? ` extends ${base.name || base}`:''}`
                        this.log(sql)
                        await track(() => one(s.command(sql)))
                        return s
                    })
                }
            }
            this._schema = this.options.schema[this.name]
            this.session = this._schema.promise
        }
        return this
    }

    /**
     * Creates a new property in the schema. It requires that the class for the property already exist on the database.
     * @param {string} name Defines the logical name for the property.
     * @param {string} type Defines the property data type.
     */
    property(name, type) {
        if (this.options.manageSchema) {
            this.extends()
            this._schema.promise = this._schema.promise.then(async s => {
                const sql = `create property ${this.name}.${name} if not exists ${type}`
                this.log(sql)
                await track(() => s.command(sql))
                return s
            })
            this.session = this._schema.promise
        }
        return this
    }

    /**
     * Ensures an index exists. If the index already exists, this will not overwrite or reconfigure it.
     * @param {string[]} properties Array of properties to include in the index
     * @param {string} type Defines the index type that you want to use.
     * @param {string} name Optional. Specify the name of the index.
     */
    index(properties, type, name) {
        if (this.options.manageSchema) {
            if (!Array.isArray(properties)) properties = [properties]
            this.extends()
            const indexName = name || `${this.name}_${type.split(' ').join('_')}_${properties.join('_')}`
            this._schema.promise = this._schema.promise.then(async s => {
                const sql = `create index ${indexName} if not exists on ${this.name} (${properties.join(', ')}) ${type}`
                this.log(sql)
                await track(() => s.command(sql))
                return s
            })
            this.session = this._schema.promise
        }
        return this
    }

    /**
     * Inserts a regular record.
     * @param {object} record Record data
     * @returns {object} The inserted record
     * @example await db.insert('User', {name: 'Tom Hanks'})
     * @returns {Record}
     */
    async insert(record) {
        const s = await this.session
        return await track(() => s.insert().into(this.name).set(escapeObj(record)).one())
    }

    /**
     * Gets a single record
     * @param {Reference} reference Record to get
     * @returns {Record}
     */
    async get(reference) {
        const s = await this.session
        return await track(() => s.select().from(this.name).where(escapeObj(querify(reference))).one())
    }

    /** 
     * Updates records
     * @param {Reference} reference Records to update
     * @param {object} data Data to update
     */
    async update(record, data) {
        if (!data || !Object.values(data).filter(x => x !== undefined).length) throw new Error('Update requires changes')
        const s = await this.session
        return await track(() => s.update(record['@rid'] || record).set(escapeObj(data)).one())
    }

    /**
     * Creates or updates a record. The resulting record would be a combination of query and data.
     * @param {object} query Object containing identifier of the record.
     * @param {object} data Additional properties of the record.
     */
    async upsert(query, data = {}) {
        const s = await this.session
        let record = await track(() => s.select().from(this.name).where(escapeObj(query)).one())
        if (record) {
            const changed = whatChanged(record, data)
            if (changed) {
                await track(() => s.update(record['@rid']).set(changed).one())
                record = {...record, ...changed}
            }
        } else {
            record = await track(() => s.insert().into(this.name).set(escapeObj({...query, ...data})).one())
        }
        return record
    }

    /**
     * Deletes records
     * @param {object|string|object[]]|string[]]} query Object query, record, record ID, array of records, or array of record IDs.
     */
    async delete(query) {
        const s = await this.session
        await track(() => s.delete(this.type || '').from(this.name).where(escapeObj(querify(query))).one())
    }

    /**
     * Begins traversal with query
     * @param {object} query
     */
    select(query) {
        return query ? this.traverse().where(query) : this.traverse()
    }

    /**
     * Begins traversal with records
     * @param {Reference} reference 
     */
    traverse(reference) {
        const rids = toRidArray(reference)
        if (rids) {
            return new Traversal(this.session, null, `select distinct(*) from [${rids.join(', ')}]`, false, this.options)
        } else {
            return new Traversal(this.session, null, `select distinct(*) from ${this.name}`, false, this.options)
        }
    }
}

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
        let record = await this.get({out: from, in: to})
        if (record) {
            const changed = whatChanged(record, data)
            if (changed) {
                await track(() => s.update(record['@rid']).set(escapeObj(changed)).one())
                record = {...record, ...changed}
            }
        } else {
            record = await track(() => s.create('EDGE', this.name).from(toRid(from)).to(toRid(to)).set(escapeObj(data)).one())
        }
        return record
    }

    /**
     * Begins traversal with query
     * @param {object} query
     */
    select(query) {
        return query ? this.traverse().where(query) : this.traverse()
    }

    /**
     * Begins traversal with records
     * @param {Reference} reference 
     */
    traverse(record) {
        const rids = toRidArray(record)
        if (rids) {
            return new EdgeTraversal(this.session, null, `select distinct(*) from [${rids.join(', ')}]`, false, this.options)
        } else {
            return new EdgeTraversal(this.session, null, `select distinct(*) from ${this.name}`, false, this.options)
        }
    }
}

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
        let record = await track(() => s.select().from(this.name).where(escapeObj(query)).one())
        if (record) {
            const changed = whatChanged(record, data)
            if (changed) {
                await track(() => s.update(record['@rid']).set(escapeObj(changed)).one())
                record = {...record, ...changed}
            }
        } else {
            record = await track(() => s.create('VERTEX', this.name).set(escapeObj({...query, ...data})).one())
        }
        return record
    }

    /**
     * Begins traversal with query
     * @param {object} query
     */
    select(query) {
        return query ? this.traverse().where(query) : this.traverse()
    }

    /**
     * Begins traversal with records
     * @param {Reference} reference 
     */
    traverse(record) {
        const rids = toRidArray(record)
        if (rids) {
            return new VertexTraversal(this.session, null, `select distinct(*) from [${rids.join(', ')}]`, false, this.options)
        } else {
            return new VertexTraversal(this.session, null, `select distinct(*) from ${this.name}`, false, this.options)
        }
    }
}


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

class EdgeTraversal extends Traversal {
    next() {
        return this
    }
    outV() {
        return new VertexTraversal(this.session, this, `outV()`, true)
    }
    inV() {
        return new VertexTraversal(this.session, this, `inV()`, true)
    }
    bothV() {
        return new VertexTraversal(this.session, this, `bothV()`, true)
    }
    where(criteria) {
        return new EdgeTraversal(this.session, this, `select distinct(*) from (${this.toString()}) WHERE ${objectCriteria(criteria)}`, false)
    }
}

class VertexTraversal extends Traversal {
    next() {
        return this
    }
    out(...edgeNames) {
        return new VertexTraversal(this.session, this, `out(${edgeNames.map(e => `'${e.name || e}'`).join(', ')})`, true)
    }
    outE(...edgeNames) {
        return new EdgeTraversal(this.session, this, `outE(${edgeNames.map(e => `'${e.name || e}'`).join(', ')})`, true)
    }
    in(...edgeNames) {
        return new VertexTraversal(this.session, this, `in(${edgeNames.map(e => `'${e.name || e}'`).join(', ')})`, true)
    }
    inE(...edgeNames) {
        return new EdgeTraversal(this.session, this, `inE(${edgeNames.map(e => `'${e.name || e}'`).join(', ')})`, true)
    }
    both(...edgeNames) {
        return new VertexTraversal(this.session, this, `both(${edgeNames.map(e => `'${e.name || e}'`).join(', ')})`, true)
    }
    bothE(...edgeNames) {
        return new EdgeTraversal(this.session, this, `bothE(${edgeNames.map(e => `'${e.name || e}'`).join(', ')})`, true)
    }
    where(criteria) {
        return new VertexTraversal(this.session, this, `select distinct(*) from (${this.toString()}) WHERE ${objectCriteria(criteria)}`, false)
    }
}

const create = opts => new Client(opts)

module.exports = {
    create,
    Client,
    Database,
    Class
}