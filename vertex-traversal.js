const nest = require('nest-literal')

const Traversal = require('./traversal')
const EdgeTraversal = require('./edge-traversal')

class VertexTraversal extends Traversal {
  /** @return {VertexTraversal} */
  out(...edgeNames) {
    return this._next(VertexTraversal, nest`out(${edgeNames.map(e => `'${e.name || e}'`).join(', ')})`, { chainable: true })
  }
  /** @return {EdgeTraversal} */
  outE(...edgeNames) {
    return this._next(EdgeTraversal, nest`outE(${edgeNames.map(e => `'${e.name || e}'`).join(', ')})`, { chainable: true })
  }
  /** @return {VertexTraversal} */
  in(...edgeNames) {
    return this._next(VertexTraversal, nest`in(${edgeNames.map(e => `'${e.name || e}'`).join(', ')})`, { chainable: true })
  }
  /** @return {EdgeTraversal} */
  inE(...edgeNames) {
    return this._next(EdgeTraversal, nest`inE(${edgeNames.map(e => `'${e.name || e}'`).join(', ')})`, { chainable: true })
  }
  /** @return {VertexTraversal} */
  both(...edgeNames) {
    return this._next(VertexTraversal, nest`both(${edgeNames.map(e => `'${e.name || e}'`).join(', ')})`, { chainable: true })
  }
  /** @return {EdgeTraversal} */
  bothE(...edgeNames) {
    return this._next(EdgeTraversal, nest`bothE(${edgeNames.map(e => `'${e.name || e}'`).join(', ')})`, { chainable: true })
  }
}

module.exports = VertexTraversal