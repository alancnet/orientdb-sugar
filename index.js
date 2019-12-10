const { RecordID } = require('orientjs')

const Client = require('./client')
const Database = require('./database')
const Class = require('./class')
const Traversal = require('./traversal')
const Vertex = require('./vertex')
const Edge = require('./edge')
const VertexTraversal = require('./vertex-traversal')
const EdgeTraversal = require('./edge-traversal')



/**
 * @typedef Record
 * @property {(string|RecordID)} @rid
 * @property {('VERTEX'|'EDGE'|null)} @type
 */

/**
 * @typedef {(string|RecordID|Record|Array.<string>|Array.<RecordID>|Array.<Record>)} Reference
 */

const create = opts => new Client(opts)

module.exports.create = create
module.exports.Client = Client
module.exports.Database = Database
module.exports.Class = Class
module.exports.Traversal = Traversal
module.exports.Vertex = Vertex
module.exports.Edge = Edge
module.exports.VertexTraversal = VertexTraversal
module.exports.EdgeTraversal = EdgeTraversal