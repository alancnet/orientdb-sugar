const gefer = require('gefer')
const {AsyncGenerator} = require('generator-extensions')
const {OrientDBClient} = require('orientjs')
const _ = require('lodash')

const whatChanged = (record, data) => {
    const changed = Object.entries(data).filter(([key, value]) => !_.eq(value, record[key]))
    if (changed.length) return Object.fromEntries(changed)
    else return null
}

const toRid = (record) => {
    if (record && record['@rid']) return record['@rid'].toString()
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
    $eq: (f, v) => `$current.\`${f}\` = ${JSON.stringify(v)}`,
    $ne: (f, v) => `$current.\`${f}\` != ${JSON.stringify(v)}`,
    $gt: (f, v) => `$current.\`${f}\` > ${JSON.stringify(v)}`,
    $gte: (f, v) => `$current.\`${f}\` >= ${JSON.stringify(v)}`,
    $lt: (f, v) => `$current.\`${f}\` < ${JSON.stringify(v)}`,
    $lte: (f, v) => `$current.\`${f}\` <= ${JSON.stringify(v)}`,
    $in: (f, v) => `$current.\`${f}\` in ${JSON.stringify(v)}`,
    $nin: (f, v) => `$current.\`${f}\` not in ${JSON.stringify(v)}`
}

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
     */
    constructor(options) {
        this.client = OrientDBClient.connect({
            host: options.host,
            port: options.port
        })
        this.options = options
    }
    /**
     * 
     * @param {string} name Database name, defaults to database specified in client options.
     * @param {object} options 
     * @param {string} options.username Username
     * @param {string} options.password Password
     */
    db(name, options = {}) {
        if (!name) name = name || options.database || options.name
        const session = this.client.then(client => client.session({
            name,
            username: options.username || this.options.username,
            password: options.password || this.options.password
        }))

        return new Database(session, options)
    }
    async close() {
        return (await this.client).close()
    }
}

class Database {
    constructor(session, options) {
        this.session = session
        this.options = options
    }
    async * query(queryText, options) {
        const subject = gefer.subject()
        const s = await this.session
        s.query(queryText, options)
            .on('data', subject.next)
            .on('error', subject.error)
            .on('end', subject.return)
        yield* subject()
    }
    async insert(name, record) {
        return await new Class(this.session, name).insert(record)
    }
    async insertVertex(name, data) {
        return await this.vertex(name).insert(data)
    }
    async insertEdge(name, from, to, data = {}) {
        return await this.edge(name).insert(from, to, data)
    }
    async get(name, query) {
        return await new Class(this.session, name).get(query)
    }
    async* select(name, query) {
        yield* new Class(this.session, name).select(query)
    }
    async update(name, record, data) {
        return await new Class(this.session, name).update(record, data)
    }
    async upsert(name, query, data = {}) {
        return await new Class(this.session, name).upsert(query, data)
    }
    async upsertVertex(name, query, data) {
        return await this.vertex(name).upsert(query, data)
    }
    async upsertEdge(name, from, to, data = {}) {
        return await this.edge(name).upsert(from, to, data)
    }
    class(name) {
        return new Class(this.session, name)
    }
    vertex(name) {
        return new Vertex(this.session, name)
    }
    edge(name) {
        return new Edge(this.session, name)
    }
}

class Class {
    constructor(session, name) {
        this.session = session
        this.name = name
    }

    async insert(data) {
        const s = await this.session
        return await s.insert().into(this.name).set(data).one()
    }

    async get(query) {
        const s = await this.session
        return await s.select().from(this.name).where(query).one()
    }

    async update(record, data) {
        const s = await this.session
        return await s.update(record['@rid'] || record).set(data).one()
    }

    async upsert(query, data = {}) {
        const s = await this.session
        let record = await s.select().from(this.name).where(query).one()
        if (record) {
            const changed = whatChanged(record, data)
            if (changed) {
                await s.update(record['@rid']).set(changed).one()
                record = {...record, ...changed}
            }
        } else {
            record = await s.insert().into(this.name).set({...query, ...data}).one()
        }
        return record
    }

    select(query) {
        return query ? this.traverse().where(query) : this.traverse()
    }

    traverse(record) {
        const rids = toRidArray(record)
        if (rids) {
            return new VertexTraversal(this.session, null, `select from [${rids.join(', ')}]`)
        } else {
            return new VertexTraversal(this.session, null, `select from ${this.name}`)
        }
    }
}

class Edge extends Class {
    constructor(session, name) {
        super(session, name)
    }
    async insert(from, to, data = {}) {
        const s = await this.session
        return await s.create('EDGE', this.name).from(from).to(to).set(data).one()
    }
    async upsert(from, to, data = {}) {
        from = from['@rid'] || from
        to = to['@rid'] || to
        const s = await this.session
        let record = await this.get({out: from, in: to})
        if (record) {
            const changed = whatChanged(record, data)
            if (changed) {
                await s.update(record['@rid']).set(changed).one()
                record = {...record, ...changed}
            }
        } else {
            record = await s.create('EDGE', this.name).from(from).to(to).set(data).one()
        }
        return record
    }

    select(query) {
        return query ? this.traverse().where(query) : this.traverse()
    }

    traverse(record) {
        const rids = toRidArray(record)
        if (rids) {
            return new EdgeTraversal(this.session, null, `select from [${rids.join(', ')}]`)
        } else {
            return new EdgeTraversal(this.session, null, `select from ${this.name}`)
        }
    }
}

class Vertex extends Class {
    constructor(session, name) {
        super(session, name)
    }
    async insert(data) {
        const s = await this.session
        return await s.create('VERTEX', this.name).set(data).one()
    }
    async upsert(query, data = {}) {
        const s = await this.session
        let record = await s.select().from(this.name).where(query).one()
        if (record) {
            const changed = whatChanged(record, data)
            if (changed) {
                await s.update(record['@rid']).set(changed).one()
                record = {...record, ...changed}
            }
        } else {
            record = await s.create('VERTEX', this.name).set({...query, ...data}).one()
        }
        return record
    }

    select(query) {
        return query ? this.traverse().where(query) : this.traverse()
    }

    traverse(record) {
        const rids = toRidArray(record)
        if (rids) {
            return new VertexTraversal(this.session, null, `select from [${rids.join(', ')}]`)
        } else {
            return new VertexTraversal(this.session, null, `select from ${this.name}`)
        }
    }
}


class Traversal {
    constructor(session, parent, expression, chainable = false) {
        this.session = session
        this.parent = parent
        this.expression = expression
        this.chainable = chainable
    }
    toString(expr) {
        if (expr) {
            if (this.chainable) {
                return this.parent.toString(`${this.expression}.${expr}`)
            } else {
                return `select ${expr} from (${this.expression})`
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
        console.log(query)
        yield* s.query(query)
    }
    next() {
        return this
    }
    limit() {
        return this.next()
    }
    where(criteria) {
        return new Traversal(this.session, this, `${this.toString()} WHERE ${objectCriteria(criteria)}`, false)
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
        return new EdgeTraversal(this.session, this, `${this.toString()} WHERE ${objectCriteria(criteria)}`, false)
    }
}

class VertexTraversal extends Traversal {
    next() {
        return this
    }
    out(edgeName) {
        return new VertexTraversal(this.session, this, `out('${edgeName}')`, true)
    }
    outE(edgeName) {
        return new EdgeTraversal(this.session, this, `outE('${edgeName}')`, true)
    }
    in(edgeName) {
        return new VertexTraversal(this.session, this, `in('${edgeName}')`, true)
    }
    inE(edgeName) {
        return new EdgeTraversal(this.session, this, `inE('${edgeName}')`, true)
    }
    both(edgeName) {
        return new VertexTraversal(this.session, this, `both('${edgeName}')`, true)
    }
    bothE(edgeName) {
        return new EdgeTraversal(this.session, this, `bothE('${edgeName}')`, true)
    }
    where(criteria) {
        return new VertexTraversal(this.session, this, `${this.toString()} WHERE ${objectCriteria(criteria)}`, false)
    }
}

const create = opts => new Client(opts)

module.exports = {
    create,
    Client,
    Database,
    Class
}