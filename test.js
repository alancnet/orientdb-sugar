const { create } = require('./index')

async function main() {
  const client = create({
    host: 'localhost',
    port: 2424,
    username: 'root',
    password: 'root',
    manageSchema: true,
    log: console.log
  })
  const db = client.db('test2')

  // Define a schema
  const Company = await db.class('Company')
    .property('name', 'string')
  const Studio = await db.class('Studio', Company)

  // Add a record
  const marvel = await Studio.insert({ name: 'Marvel Studios' })

  const Actor = await db.vertex('Actor')
    .property('name', 'string')
    .index('name', 'unique')

  const ActedIn = await db.edge('ActedIn')

  const StarredIn = await db.edge('StarredIn')

  const Film = await db.vertex('Film')
    .property('name', 'string')
    .property('year', 'integer')
    .index('name', 'unique')

  // Add some data
  // Create a vertex
  const tomHanks = await Actor.upsert({ name: 'Tom Hanks' }, { born: '1956-07-09' })

  // Create another vertex
  const big = await Film.upsert({ name: 'Big' }, { year: 1988, release: '1998-06-03', genre: ['Drama', 'Fantasy'] })

  // Create an edge
  await ActedIn.upsert(tomHanks, big, { character: 'Josh Baskin' })

  // Another way: Learning

  // By reference, "Learn Tom Hanks acted in Big"
  await db.learn(tomHanks, ActedIn, big)

  // By anonymous, "Learn actor Jared Rushton acted in film Big as Billy".
  // This method assumes the only property of the first object is the class,
  // and the first property of the inner object is the unique identifier.
  await db.learn(
    { Actor: { name: 'Jared Rushton' } }, // <-- Anonymous vertex upsert
    'ActedIn',                           // <-- Edge name
    { Film: { name: 'Big' } },             // <-- Anonymous vertex upsert
    { character: 'Billy' }               // <-- Edge properties
  )

  // Bulk learning

  // Actors Robert Downey Jr., Chris Evans, Mark Ruffalo, Chris Hemsworth, Scarlett Johansson,
  // acted in Avengers, Avengers: Age of Ultron, Avengers: Infinity War, and Avengers: Endgame

  await db.learn(
    [
      { Actor: { name: 'Robert Downey Jr.' } },
      { Actor: { name: 'Chris Evans' } },
      { Actor: { name: 'Mark Ruffalo' } },
      { Actor: { name: 'Chris Hemsworth' } },
      { Actor: { name: 'Scarlett Johansson' } }
    ],
    [
      { ActedIn: { starring: true } },
      { StarredIn: {} }
    ],
    [
      { Film: { name: 'Avengers', year: 2012 } },
      { Film: { name: 'Avengers: Age of Ultron', year: 2015 } },
      { Film: { name: 'Avengers: Infinity War', year: 2018 } },
      { Film: { name: 'Avengers: Endgame', year: 2019 } }
    ]
  )

  // Get a single record
  const rdj = await Actor.traverse().where({ name: 'Robert Downey Jr.' }).one()

  // Traverse the graph by reference, and retrieve many records as an array.
  const costars = await Actor.traverse(rdj).out(ActedIn).in(StarredIn).where({ name: { $ne: rdj.name } }).toArray()
  console.log(`${rdj.name}'s co-stars are ${costars.map(x => x.name).join(', ')}`)
  console.log('They acted in:')

  // Traverse the graph by anonymous, and stream results using async generator.
  for await (let film of db.v(costars).out('ActedIn')) {
    console.log(film.name)
  }
  for await (let edge of db.v(costars).outE()) {
    console.log(edge['@class'])
  }

  // Delete some records
  await Actor.delete({ name: 'Jared Rushton' })
  await Actor.delete(rdj)

  // Do some safe raw SQL:
  const actors = await db.sql`SELECT FROM Actor WHERE name != ${tomHanks.name}`.toArray()
  for await (let edge of db.sql`SELECT FROM ActedIn`) {
    console.log(edge)
  }

  // Close the connection
  await client.close()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})