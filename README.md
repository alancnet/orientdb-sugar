# OrientDB-Sugar

Provides syntactic sugar, including gremlin-like operators, for Graph database operations on OrientDB.

## Usage

```javascript
import { Client } from 'orientdb-sugar'

async function main() {

  // Connect to your server
  const client = new Client({
    host: 'localhost',
    port: 2424,
    username: 'leroyjenkins',
    password: 'ohgodhesgoingin',
    manageSchema: true, // <-- Enables automatic creation of classes, properties, and indices.
    log: console.log // <-- Enables you to see what commands and queries are being run.
  })

  const db = client.db('test')

  // Define a schema
  const Actor = db.vertex('Actor')
    .property('name', 'string')
    .index('name', 'unique')

  const ActedIn = db.edge('ActedIn')

  const StarredIn = db.edge('StarredIn')

  const Film = db.vertex('Film')
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
    { Actor: { name: 'Jared Rushton' }}, // <-- Anonymous vertex upsert
    'ActedIn',                           // <-- Edge name
    { Film: { name: 'Big'}},             // <-- Anonymous vertex upsert
    { character: 'Billy' }               // <-- Edge properties
  )

  // Bulk learning

  // Actors Robert Downey Jr., Chris Evans, Mark Ruffalo, Chris Hemsworth, Scarlett Johansson,
  // acted in Avengers, Avengers: Age of Ultron, Avengers: Infinity War, and Avengers: Endgame

  await db.learn(
    [
      {Actor: { name: 'Robert Downey Jr.'}},
      {Actor: { name: 'Chris Evans' }},
      {Actor: { name: 'Mark Ruffalo' }},
      {Actor: { name: 'Chris Hemsworth' }},
      {Actor: { name: 'Scarlett Johansson' }}
    ],
    [
      {ActedIn: { starring: true }},
      {StarredIn: {}}
    ],
    [
      {Film: { name: 'Avengers', year: 2012 }},
      {Film: { name: 'Avengers: Age of Ultron', year: 2015 }},
      {Film: { name: 'Avengers: Infinity War', year: 2018 }},
      {Film: { name: 'Avengers: Endgame', year: 2019 }}
    ]
  )

  // Get a single record
  const rdj = await Actor.select({name: 'Robert Downey Jr.'}).one()

  // Traverse the graph by reference, and retrieve many records as an array.
  const costars = await Actor.traverse(rdj).out(ActedIn).in(StarredIn).where({name: {$ne: rdj.name}}).toArray()
  console.log(`${rdj.name}'s co-stars are ${costars.map(x => x.name).join(', ')}`)
  console.log('They acted in:')

  // Traverse the graph by anonymous, and stream results using async generator.
  for await (let film of db.v(costars).out('ActedIn')) {
    console.log(film.name)
  }

  // Close the connection
  await client.close()
}
```