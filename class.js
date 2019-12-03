const { escapeObj, promisify, one, whatChanged, toRidArray, querify, track } = require('./util')

const Traversal = require('./traversal')

/**
 * @implements {Promise<Class>}
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
   * @param {(object|string|object[]|string[])} query Object query, record, record ID, array of records, or array of record IDs.
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

module.exports = Class