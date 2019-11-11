const { create } = require('./index')

async function main() {
    const client = create({
        host: 'localhost',
        port: 2424,
        database: 'test',
        username: 'root',
        password: 'root',
        manageSchema: true,
        log: console.log
    })
    const test = client.db('test')

    // const v1 = await test.upsertVertex('Actor', {name: 'Tom Hanks'})
    // const v2 = await test.upsertVertex('Movie', {name: 'Forest Gump'})
    // const e = await test.upsertEdge('ActedIn', v1, v2)

    // console.log(test.vertex('Actor').traverse().out('ActedIn').out('FromStudio').outE('something')
    // .where({
    //     $and: [
    //         {age: 54},
    //         {blue: 677}
    //     ],
    //     $or: [
    //         {age: 54, banana: 'hi'},
    //         {blue: 677}
    //     ]
    // })
    // .toString())

    const Actor = test.vertex('Actor')
    .property('name', 'string')
    .index('name', 'fulltext engine lucene')

    const v = await test.vertex('Something2')
    .property('name', 'string')
    .index('name', 'fulltext engine lucene')
    .property('id', 'integer')
    .index('id', 'unique')
    .upsert({id: 123}, {name: 'foobar'})

    test.vertex('SomethingElse')

    test.edge('Touches')

    const v2 = await test.vertex('SomethingElse').upsert({name: 'hi'})

    await test.edge('Touches').upsert(v, v2)

    for await (let actor of test.vertex('Actor').traverse().where({name: {$ne: null}})) {
        console.log(actor)
    }
    for await (let record of test.vertex('Something2').select()) {
        console.log(record)
    }

    console.log(await test.vertex('Actor').traverse().toArray())
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