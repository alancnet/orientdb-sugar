const {OrientDBClient} = require('orientjs')
const _ = require('lodash')

const Database = require('./database')

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

module.exports = Client