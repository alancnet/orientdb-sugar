const gefer = require('gefer')
const {AsyncGenerator} = require('generator-extensions')
const {OrientDBClient} = require('orientjs')
const _ = require('lodash')

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
        this.session = this.client.then(client => client.session({
            name: options.database || options.name,
            username: options.username,
            password: options.password
        }))
    }
    db(name) {
        return new Database(this.session)
    }
    async close() {
        return (await this.client).close()
    }
}

class Database {
    constructor(session) {
        this.session = session
    }
    class(name) {
        return new Class(this.session, name)
    }
    async insert(className, record) {
        return await new Class(this.session, className).insert(record)
    }
    async insertEdge(className, from, to, data = {}) {
        return await new Class(this.session, className).insertEdge(from, to, data)
    }
    async get(className, query) {
        return await new Class(this.session, className).get(query)
    }
    async* select(className, query) {
        yield* new Class(this.session, className).select(query)
    }
    async update(className, record, data) {
        return await new Class(this.session, className).update(record, data)
    }
    async upsert(className, query, data = {}) {
        return await new Class(this.session, className).upsert(query, data)
    }
    async upsertEdge(className, from, to, data = {}) {
        return await new Class(this.session, className).upsertEdge(from, to, data)
    }
}

class Class {
    constructor(session, name) {
        this.session = session
        this.name = name
    }

    async insert(record) {
        const s = await this.session
        return await s.insert().into(this.name).set(record).one()
    }

    async insertEdge(from, to, data = {}) {
        const s = await this.session
        return await s.create('EDGE', this.name).from(from).to(to).set(data).one()
    }

    async get(query) {
        const s = await this.session
        return await s.select().from(this.name).where(query).one()
    }

    async * select(query) {
        const subject = gefer.subject()
        const s = await this.session
        s.select().from(this.name).where(query)
        .on('data', subject.next)
        .on('error', subject.error)
        .on('end', subject.return)
        yield* subject
    }

    async update(record, data) {
        const s = await this.session
        return await s.update(record['@rid'] || record).set(data).one()
    }

    async upsert(query, data = {}) {
        const s = await this.session
        let record = await s.select().from(this.name).where(query).one()
        if (record) {
            if (Object.entries(data).some(([key, value]) => !_.eq(value, record[key]))) {
                await s.update(record['@rid']).set(data).one()
                record = {...record, ...data}
            }
        } else {
            record = await s.insert().into(this.name).set({...query, ...data}).one()
        }
        return record
    }

    async upsertEdge(from, to, data = {}) {
        from = from['@rid'] || from
        to = to['@rid'] || to
        const s = await this.session
        let record = await this.get({out: from, in: to})
        if (record) {
            if (Object.entries(data).some(([key, value]) => !_.eq(value, record[key]))) {
                await s.update(record['@rid']).set(data).one()
                record = {...record, ...data}
            }
        } else {
            record = await s.create('EDGE', this.name).from(from).to(to).set(data).one()
        }
        return record
    }
}

const create = opts => new Client(opts)

module.exports = {
    create,
    Client,
    Database,
    Class
}