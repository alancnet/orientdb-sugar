const { create } = require('./index')

async function main() {
    const client = create({
        host: 'localhost',
        port: 2424,
        database: 'test',
        username: 'root',
        password: 'root'
    })
    const test = client.db('test')

    const v1 = await test.upsert('Actor', {name: 'Tom Hanks'})
    const v2 = await test.upsert('Movie', {name: 'Forest Gump'})
    const e = await test.upsertEdge('ActedIn', v1, v2)

    await client.close()
}

/*
const { Graph } = require('memory-graph')

const g = new Graph()
const v1 = g.addVertex({name: 'Tom Hanks'})
const v2 = g.addVertex({name: 'Forest Gump'})
const e = g.addEdge(v1, v2, 'actedIn')

const actors = g.v()
  .has({name: 'Forest Gump'})
  .in('actedIn')
  .toArray()
  .map(v => v.name)
*/

main().catch(err => {
    console.error(err)
    process.exit(1)
})