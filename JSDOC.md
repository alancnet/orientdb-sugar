## Modules

<dl>
<dt><a href="#module_Json">Json</a></dt>
<dd></dd>
</dl>

## Classes

<dl>
<dt><a href="#Class">Class</a></dt>
<dd><p>Represents a Class in the schema.</p>
</dd>
<dt><a href="#Client">Client</a></dt>
<dd><p>Connects to a server.</p>
</dd>
<dt><a href="#Database">Database</a></dt>
<dd><p>Represents a database</p>
</dd>
<dt><a href="#EdgeTraversal">EdgeTraversal</a></dt>
<dd><p>Represents a traversal from an edge</p>
</dd>
<dt><a href="#Edge">Edge</a></dt>
<dd><p>Represents an Edge Class in the schema</p>
</dd>
<dt><a href="#Traversal">Traversal</a></dt>
<dd><p>Represents a traversal</p>
</dd>
<dt><a href="#VertexTraversal">VertexTraversal</a></dt>
<dd><p>Represents a traversal from a vertex</p>
</dd>
<dt><a href="#Vertex">Vertex</a></dt>
<dd><p>Represents a Vertex Class in the schema.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#Record">Record</a></dt>
<dd></dd>
<dt><a href="#Reference">Reference</a> : <code>string</code> | <code>RecordID</code> | <code><a href="#Record">Record</a></code> | <code>Array.&lt;string&gt;</code> | <code>Array.&lt;RecordID&gt;</code> | <code><a href="#Record">Array.&lt;Record&gt;</a></code></dt>
<dd></dd>
</dl>

<a name="module_Json"></a>

## Json

* [Json](#module_Json)
    * [~link(records)](#module_Json..link) ⇒ <code>Array.&lt;object&gt;</code>
    * [~unlink(records)](#module_Json..unlink) ⇒ <code>Array.&lt;object&gt;</code>
    * [~stringify(records, opts)](#module_Json..stringify)
    * [~parse(json)](#module_Json..parse)

<a name="module_Json..link"></a>

### Json~link(records) ⇒ <code>Array.&lt;object&gt;</code>
Replaces Record IDs with Record references.

**Kind**: inner method of [<code>Json</code>](#module_Json)  

| Param | Type |
| --- | --- |
| records | <code>Array.&lt;object&gt;</code> | 

<a name="module_Json..unlink"></a>

### Json~unlink(records) ⇒ <code>Array.&lt;object&gt;</code>
Replaces Record references with Record IDs

**Kind**: inner method of [<code>Json</code>](#module_Json)  

| Param | Type |
| --- | --- |
| records | <code>Array.&lt;object&gt;</code> | 

<a name="module_Json..stringify"></a>

### Json~stringify(records, opts)
JSON stringifies a graph which may have circular references.

**Kind**: inner method of [<code>Json</code>](#module_Json)  

| Param | Type | Description |
| --- | --- | --- |
| records | <code>Array.&lt;object&gt;</code> |  |
| opts | <code>object</code> | JSON.stringify options |

<a name="module_Json..parse"></a>

### Json~parse(json)
Parses JSON into a graph which may have circular references

**Kind**: inner method of [<code>Json</code>](#module_Json)  

| Param | Type |
| --- | --- |
| json | <code>string</code> | 

<a name="Class"></a>

## Class
Represents a Class in the schema.

**Kind**: global class  
**Implements**: [<code>Promise&lt;Class&gt;</code>](#Class)  

* [Class](#Class)
    * [.extends(base)](#Class+extends)
    * [.property(name, type)](#Class+property)
    * [.index(properties, type, name)](#Class+index)
    * [.insert(record)](#Class+insert) ⇒ <code>object</code> \| [<code>Record</code>](#Record)
    * [.get(reference)](#Class+get) ⇒ [<code>Record</code>](#Record)
    * [.update(reference, data)](#Class+update)
    * [.upsert(query, data)](#Class+upsert)
    * [.delete(query)](#Class+delete)
    * [.traverse(reference)](#Class+traverse)

<a name="Class+extends"></a>

### class.extends(base)
Creates a new class in the schema.

**Kind**: instance method of [<code>Class</code>](#Class)  

| Param | Type | Description |
| --- | --- | --- |
| base | <code>string</code> | Optional base class |

<a name="Class+property"></a>

### class.property(name, type)
Creates a new property in the schema. It requires that the class for the property already exist on the database.

**Kind**: instance method of [<code>Class</code>](#Class)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Defines the logical name for the property. |
| type | <code>string</code> | Defines the property data type. |

<a name="Class+index"></a>

### class.index(properties, type, name)
Ensures an index exists. If the index already exists, this will not overwrite or reconfigure it.

**Kind**: instance method of [<code>Class</code>](#Class)  

| Param | Type | Description |
| --- | --- | --- |
| properties | <code>Array.&lt;string&gt;</code> | Array of properties to include in the index |
| type | <code>string</code> | Defines the index type that you want to use. |
| name | <code>string</code> | Optional. Specify the name of the index. |

<a name="Class+insert"></a>

### class.insert(record) ⇒ <code>object</code> \| [<code>Record</code>](#Record)
Inserts a regular record.

**Kind**: instance method of [<code>Class</code>](#Class)  
**Returns**: <code>object</code> - The inserted record[<code>Record</code>](#Record)  

| Param | Type | Description |
| --- | --- | --- |
| record | <code>object</code> | Record data |

**Example**  
```js
await db.insert('User', {name: 'Tom Hanks'})
```
<a name="Class+get"></a>

### class.get(reference) ⇒ [<code>Record</code>](#Record)
Gets a single record

**Kind**: instance method of [<code>Class</code>](#Class)  

| Param | Type | Description |
| --- | --- | --- |
| reference | [<code>Reference</code>](#Reference) | Record to get |

<a name="Class+update"></a>

### class.update(reference, data)
Updates records

**Kind**: instance method of [<code>Class</code>](#Class)  

| Param | Type | Description |
| --- | --- | --- |
| reference | [<code>Reference</code>](#Reference) | Records to update |
| data | <code>object</code> | Data to update |

<a name="Class+upsert"></a>

### class.upsert(query, data)
Creates or updates a record. The resulting record would be a combination of query and data.

**Kind**: instance method of [<code>Class</code>](#Class)  

| Param | Type | Description |
| --- | --- | --- |
| query | <code>object</code> | Object containing identifier of the record. |
| data | <code>object</code> | Additional properties of the record. |

<a name="Class+delete"></a>

### class.delete(query)
Deletes records

**Kind**: instance method of [<code>Class</code>](#Class)  

| Param | Type | Description |
| --- | --- | --- |
| query | <code>object</code> \| <code>string</code> \| <code>Array.&lt;object&gt;</code> \| <code>Array.&lt;string&gt;</code> | Object query, record, record ID, array of records, or array of record IDs. |

<a name="Class+traverse"></a>

### class.traverse(reference)
Begins traversal with records

**Kind**: instance method of [<code>Class</code>](#Class)  

| Param | Type |
| --- | --- |
| reference | [<code>Reference</code>](#Reference) | 

<a name="Client"></a>

## Client
Connects to a server.

**Kind**: global class  

* [Client](#Client)
    * [new Client(options)](#new_Client_new)
    * [.db(name, options)](#Client+db)

<a name="new_Client_new"></a>

### new Client(options)

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | Connection options |
| options.host | <code>string</code> | Hostname |
| options.port | <code>string</code> | Port |
| options.database | <code>string</code> | Database name |
| options.username | <code>string</code> | Username |
| options.password | <code>string</code> | Password |
| options.manageSchema | <code>boolean</code> | Enables the client to create classes, properties, and indices. |

<a name="Client+db"></a>

### client.db(name, options)
**Kind**: instance method of [<code>Client</code>](#Client)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Database name, defaults to database specified in client options. Will create database if manageSchema is true. |
| options | <code>object</code> |  |
| options.username | <code>string</code> | Username |
| options.password | <code>string</code> | Password |

<a name="Database"></a>

## Database
Represents a database

**Kind**: global class  

* [Database](#Database)
    * [.sql()](#Database+sql) ⇒ <code>AsyncIterable.&lt;\*&gt;</code>
    * [.query(queryText, options)](#Database+query) ⇒ <code>AsyncIterable.&lt;\*&gt;</code>
    * [.command(queryText, options)](#Database+command) ⇒ <code>AsyncIterable.&lt;\*&gt;</code>
    * [.insert(name, record)](#Database+insert) ⇒ <code>object</code> \| [<code>Record</code>](#Record)
    * [.insertVertex(name, data)](#Database+insertVertex) ⇒ <code>object</code> \| [<code>Record</code>](#Record)
    * [.insertEdge(name, from, to, data)](#Database+insertEdge) ⇒ <code>object</code> \| [<code>Record</code>](#Record)
    * [.get(name, reference)](#Database+get) ⇒ [<code>Record</code>](#Record)
    * [.select(name, reference)](#Database+select) ⇒ [<code>AsyncIterator.&lt;Record&gt;</code>](#Record)
    * [.update(name, reference, data)](#Database+update)
    * [.upsert(name, query, data)](#Database+upsert)
    * [.upsertVertexObject(object)](#Database+upsertVertexObject) ⇒ [<code>Record</code>](#Record)
    * [.upsertEdgeObject(object, from, to)](#Database+upsertEdgeObject)
    * [.upsertVertex(name, query, data)](#Database+upsertVertex)
    * [.upsertEdge(name, query, from, to, data)](#Database+upsertEdge)
    * [.learn(from, edge, to, data)](#Database+learn)
    * [.class(name, base)](#Database+class)
    * [.vertex(name, base)](#Database+vertex)
    * [.edge(name, base)](#Database+edge) ⇒ [<code>Edge</code>](#Edge)
    * [.v(reference)](#Database+v) ⇒ [<code>VertexTraversal</code>](#VertexTraversal)
    * [.e(reference)](#Database+e) ⇒ [<code>EdgeTraversal</code>](#EdgeTraversal)

<a name="Database+sql"></a>

### database.sql() ⇒ <code>AsyncIterable.&lt;\*&gt;</code>
Execute SQL as a template.

**Kind**: instance method of [<code>Database</code>](#Database)  
**Example**  
```js
await db.sql`SELECT FROM User WHERE name = ${myName}`.toArray()
```
**Example**  
```js
for await (let record of db.sql`SELECT FROM User WHERE name = ${myName}`)
```
<a name="Database+query"></a>

### database.query(queryText, options) ⇒ <code>AsyncIterable.&lt;\*&gt;</code>
Execute Raw SQL.

**Kind**: instance method of [<code>Database</code>](#Database)  

| Param | Type | Description |
| --- | --- | --- |
| queryText | <code>string</code> | Raw SQL |
| options | <code>object</code> | Query options |
| options.params | <code>object</code> | Query parameters |

**Example**  
```js
await db.query('SELECT FROM User WHERE name = :p1', {params: {p1: 'Tom Hanks'}}).toArray()
```
<a name="Database+command"></a>

### database.command(queryText, options) ⇒ <code>AsyncIterable.&lt;\*&gt;</code>
Execute Raw SQL.

**Kind**: instance method of [<code>Database</code>](#Database)  

| Param | Type | Description |
| --- | --- | --- |
| queryText | <code>string</code> | Raw SQL |
| options | <code>object</code> | Query options |
| options.params | <code>object</code> | Query parameters |

**Example**  
```js
await db.query(`INSERT INTO User SET name = ${name}`).toArray()
```
<a name="Database+insert"></a>

### database.insert(name, record) ⇒ <code>object</code> \| [<code>Record</code>](#Record)
Inserts a regular record.

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>object</code> - The inserted record[<code>Record</code>](#Record)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of the class / table |
| record | <code>object</code> | Record data |

**Example**  
```js
await db.insert('User', {name: 'Tom Hanks'})
```
<a name="Database+insertVertex"></a>

### database.insertVertex(name, data) ⇒ <code>object</code> \| [<code>Record</code>](#Record)
Inserts a vertex record.

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>object</code> - The inserted record[<code>Record</code>](#Record)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of the vertex class |
| data | <code>object</code> | Record data |

**Example**  
```js
await db.insert('User', {name: 'Tom Hanks'})
```
<a name="Database+insertEdge"></a>

### database.insertEdge(name, from, to, data) ⇒ <code>object</code> \| [<code>Record</code>](#Record)
Inserts an edge record.

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>object</code> - The inserted record[<code>Record</code>](#Record)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of the edge class |
| from | [<code>Reference</code>](#Reference) | Record edge comes out of / from |
| to | [<code>Reference</code>](#Reference) | Record edge goes into / to |
| data | <code>object</code> | Record data |

**Example**  
```js
await db.insert('User', {name: 'Tom Hanks'})
```
<a name="Database+get"></a>

### database.get(name, reference) ⇒ [<code>Record</code>](#Record)
Gets a single record

**Kind**: instance method of [<code>Database</code>](#Database)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | Name of the class |
| reference | [<code>Reference</code>](#Reference) | Record to get |

<a name="Database+select"></a>

### database.select(name, reference) ⇒ [<code>AsyncIterator.&lt;Record&gt;</code>](#Record)
Gets multiple records

**Kind**: instance method of [<code>Database</code>](#Database)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of the class |
| reference | [<code>Reference</code>](#Reference) | Records to get |

<a name="Database+update"></a>

### database.update(name, reference, data)
Updates records

**Kind**: instance method of [<code>Database</code>](#Database)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of the class |
| reference | [<code>Reference</code>](#Reference) | Records to update |
| data | <code>object</code> | Data to update |

<a name="Database+upsert"></a>

### database.upsert(name, query, data)
Creates or updates a record. The resulting record would be a combination of query and data.

**Kind**: instance method of [<code>Database</code>](#Database)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>name</code> | Name of the class |
| query | <code>object</code> | Object containing identifier of the record. |
| data | <code>object</code> | Additional properties of the record. |

<a name="Database+upsertVertexObject"></a>

### database.upsertVertexObject(object) ⇒ [<code>Record</code>](#Record)
Creates or updates a single Vertex. *Important* The first property is assumed to be the identifier.

**Kind**: instance method of [<code>Database</code>](#Database)  

| Param | Type | Description |
| --- | --- | --- |
| object | <code>object</code> | An object with a @class property, or a single PascalCased object property naming the class. |

**Example**  
```js
await upsertVertexObject({ User: { id: 123, name: 'Tom Hanks' }})
```
**Example**  
```js
await upsertVertexObject({ '@class': 'User', id: 123, name: 'Tom Hanks' })
```
<a name="Database+upsertEdgeObject"></a>

### database.upsertEdgeObject(object, from, to)
Creates or updates an edge. *Important* the `out` and `in` properties are assumed to be a compound key.

**Kind**: instance method of [<code>Database</code>](#Database)  

| Param | Type | Description |
| --- | --- | --- |
| object | <code>object</code> | An object with a @class property, or a single PascalCased object property naming the class. |
| from | [<code>Reference</code>](#Reference) | Record edge comes out of / from |
| to | [<code>Reference</code>](#Reference) | Record edge goes into / to |

<a name="Database+upsertVertex"></a>

### database.upsertVertex(name, query, data)
Creates or updates a vertex. The resulting record would be a combination of query and data.

**Kind**: instance method of [<code>Database</code>](#Database)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>name</code> | Name of the vertex |
| query | <code>object</code> | Object containing identifier of the record. |
| data | <code>object</code> | Additional properties of the record. |

<a name="Database+upsertEdge"></a>

### database.upsertEdge(name, query, from, to, data)
Creates or updates an edge. The resulting record would be a combination of query and data.

**Kind**: instance method of [<code>Database</code>](#Database)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>name</code> | Name of the edge |
| query | <code>object</code> | Object containing identifier of the record. |
| from | [<code>Reference</code>](#Reference) | Record edge comes out of / from |
| to | [<code>Reference</code>](#Reference) | Record edge goes into / to |
| data | <code>object</code> | Additional properties of the edge. |

<a name="Database+learn"></a>

### database.learn(from, edge, to, data)
Store basic knowledge by upserting vertices and edges

**Kind**: instance method of [<code>Database</code>](#Database)  

| Param | Type | Description |
| --- | --- | --- |
| from | <code>object</code> \| <code>Array.&lt;object&gt;</code> | An object with a @class property, or a single PascalCased object property naming the class. |
| edge | <code>string</code> \| <code>object</code> \| <code>Array.&lt;string&gt;</code> \| <code>Array.&lt;object&gt;</code> | Edge class name, or an object with a @class property, or a single PascalCased object property naming the class. |
| to | <code>object</code> \| <code>Array.&lt;object&gt;</code> | An object with a @class property, or a single PascalCased object property naming the class. |
| data | <code>object</code> | Additional properties for the edge |

**Example**  
```js
await db.learn(
      { Actor: { name: 'Jared Rushton' }},
      'ActedIn',
      { Film: { name: 'Big'}}
  )
```
**Example**  
```js
await db.learn(
      { Actor: { name: 'Jared Rushton' }},
      ['ActedIn', 'CostarredIn'],
      { Film: { name: 'Big'}},
      { character: 'Billy' }
  )
```
<a name="Database+class"></a>

### database.class(name, base)
References a class. If manageSchema is true, ensures the class exists.

**Kind**: instance method of [<code>Database</code>](#Database)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of class |
| base | [<code>Class</code>](#Class) \| <code>string</code> | Base class |

<a name="Database+vertex"></a>

### database.vertex(name, base)
References a vertex class. If manageSchema is true, ensures the class exists.

**Kind**: instance method of [<code>Database</code>](#Database)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> |  |
| base | [<code>Vertex</code>](#Vertex) \| <code>string</code> | Base vertex class |

<a name="Database+edge"></a>

### database.edge(name, base) ⇒ [<code>Edge</code>](#Edge)
References an edge class. If manageSchema is true, ensures the class exists.

**Kind**: instance method of [<code>Database</code>](#Database)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> |  |
| base | [<code>Edge</code>](#Edge) \| <code>string</code> | Base edge class |

<a name="Database+v"></a>

### database.v(reference) ⇒ [<code>VertexTraversal</code>](#VertexTraversal)
Begins a traversal at the specified vertices

**Kind**: instance method of [<code>Database</code>](#Database)  

| Param | Type |
| --- | --- |
| reference | [<code>Reference</code>](#Reference) | 

<a name="Database+e"></a>

### database.e(reference) ⇒ [<code>EdgeTraversal</code>](#EdgeTraversal)
Begins a traversal at the specified edges

**Kind**: instance method of [<code>Database</code>](#Database)  

| Param | Type |
| --- | --- |
| reference | [<code>Reference</code>](#Reference) | 

<a name="EdgeTraversal"></a>

## EdgeTraversal
Represents a traversal from an edge

**Kind**: global class  

* [EdgeTraversal](#EdgeTraversal)
    * [.outV()](#EdgeTraversal+outV) ⇒ [<code>VertexTraversal</code>](#VertexTraversal)
    * [.inV()](#EdgeTraversal+inV) ⇒ [<code>VertexTraversal</code>](#VertexTraversal)
    * [.bothV()](#EdgeTraversal+bothV) ⇒ [<code>VertexTraversal</code>](#VertexTraversal)

<a name="EdgeTraversal+outV"></a>

### edgeTraversal.outV() ⇒ [<code>VertexTraversal</code>](#VertexTraversal)
**Kind**: instance method of [<code>EdgeTraversal</code>](#EdgeTraversal)  
<a name="EdgeTraversal+inV"></a>

### edgeTraversal.inV() ⇒ [<code>VertexTraversal</code>](#VertexTraversal)
**Kind**: instance method of [<code>EdgeTraversal</code>](#EdgeTraversal)  
<a name="EdgeTraversal+bothV"></a>

### edgeTraversal.bothV() ⇒ [<code>VertexTraversal</code>](#VertexTraversal)
**Kind**: instance method of [<code>EdgeTraversal</code>](#EdgeTraversal)  
<a name="Edge"></a>

## Edge
Represents an Edge Class in the schema

**Kind**: global class  
**Implements**: [<code>Promise&lt;Edge&gt;</code>](#Edge)  

* [Edge](#Edge)
    * [.extends(base)](#Edge+extends)
    * [.property(name, type)](#Edge+property)
    * [.index(properties, type, name)](#Edge+index)
    * [.insert(from, to, data)](#Edge+insert) ⇒ [<code>Record</code>](#Record)
    * [.upsert(from, to, data)](#Edge+upsert) ⇒ [<code>Record</code>](#Record)
    * [.traverse(reference)](#Edge+traverse)

<a name="Edge+extends"></a>

### edge.extends(base)
Creates a new class in the schema.

**Kind**: instance method of [<code>Edge</code>](#Edge)  

| Param | Type | Description |
| --- | --- | --- |
| base | <code>string</code> | Optional base class |

<a name="Edge+property"></a>

### edge.property(name, type)
Creates a new property in the schema. It requires that the class for the property already exist on the database.

**Kind**: instance method of [<code>Edge</code>](#Edge)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Defines the logical name for the property. |
| type | <code>string</code> | Defines the property data type. |

<a name="Edge+index"></a>

### edge.index(properties, type, name)
Ensures an index exists. If the index already exists, this will not overwrite or reconfigure it.

**Kind**: instance method of [<code>Edge</code>](#Edge)  

| Param | Type | Description |
| --- | --- | --- |
| properties | <code>Array.&lt;string&gt;</code> | Array of properties to include in the index |
| type | <code>string</code> | Defines the index type that you want to use. |
| name | <code>string</code> | Optional. Specify the name of the index. |

<a name="Edge+insert"></a>

### edge.insert(from, to, data) ⇒ [<code>Record</code>](#Record)
Inserts an edge record.

**Kind**: instance method of [<code>Edge</code>](#Edge)  

| Param | Type | Description |
| --- | --- | --- |
| from | [<code>Reference</code>](#Reference) | Source record |
| to | [<code>Reference</code>](#Reference) | Target record |
| data | <code>object</code> | Edge record data |

<a name="Edge+upsert"></a>

### edge.upsert(from, to, data) ⇒ [<code>Record</code>](#Record)
Ensures an edge exists, and updates its data.

**Kind**: instance method of [<code>Edge</code>](#Edge)  

| Param | Type | Description |
| --- | --- | --- |
| from | [<code>Reference</code>](#Reference) | Source record |
| to | [<code>Reference</code>](#Reference) | Target record |
| data | <code>object</code> | Edge record data |

<a name="Edge+traverse"></a>

### edge.traverse(reference)
Begins traversal with records

**Kind**: instance method of [<code>Edge</code>](#Edge)  

| Param | Type |
| --- | --- |
| reference | [<code>Reference</code>](#Reference) | 

<a name="Traversal"></a>

## Traversal
Represents a traversal

**Kind**: global class  

* [Traversal](#Traversal)
    * [.toString()](#Traversal+toString)
    * [.explain()](#Traversal+explain) ⇒ <code>Array.&lt;string&gt;</code>
    * [.link()](#Traversal+link) ⇒ <code>Array.&lt;any&gt;</code>
    * [.toArray()](#Traversal+toArray) ⇒ <code>Array.&lt;any&gt;</code>
    * [.one()](#Traversal+one)
    * [.where()](#Traversal+where) ⇒ <code>this</code>
    * [.slice(start, count)](#Traversal+slice) ⇒ <code>this</code>
    * [.select(fields)](#Traversal+select) ⇒ <code>this</code>

<a name="Traversal+toString"></a>

### traversal.toString()
Produces a SQL string

**Kind**: instance method of [<code>Traversal</code>](#Traversal)  
<a name="Traversal+explain"></a>

### traversal.explain() ⇒ <code>Array.&lt;string&gt;</code>
Produce an array of SQL statements that will be executed to fulfill this traversal.

**Kind**: instance method of [<code>Traversal</code>](#Traversal)  
<a name="Traversal+link"></a>

### traversal.link() ⇒ <code>Array.&lt;any&gt;</code>
Replace Record IDs with their corresponding records, so that the graph is easily traversible in code.

**Kind**: instance method of [<code>Traversal</code>](#Traversal)  
<a name="Traversal+toArray"></a>

### traversal.toArray() ⇒ <code>Array.&lt;any&gt;</code>
Collect all results into a single array.

**Kind**: instance method of [<code>Traversal</code>](#Traversal)  
<a name="Traversal+one"></a>

### traversal.one()
Returns the first record, if a record is returned.

**Kind**: instance method of [<code>Traversal</code>](#Traversal)  
<a name="Traversal+where"></a>

### traversal.where() ⇒ <code>this</code>
Filter results by a MongoDB-like query object.

**Kind**: instance method of [<code>Traversal</code>](#Traversal)  
<a name="Traversal+slice"></a>

### traversal.slice(start, count) ⇒ <code>this</code>
For pagination, skip to a subset of records.

**Kind**: instance method of [<code>Traversal</code>](#Traversal)  

| Param | Type | Description |
| --- | --- | --- |
| start | <code>number</code> | How many records to skip. |
| count | <code>number</code> | How many records to return. |

<a name="Traversal+select"></a>

### traversal.select(fields) ⇒ <code>this</code>
Pick columns to return and/or emit records thus far in a multi-step traversal.

**Kind**: instance method of [<code>Traversal</code>](#Traversal)  

| Param | Type | Description |
| --- | --- | --- |
| fields | <code>Array.&lt;string&gt;</code> | The field names to return. |

<a name="VertexTraversal"></a>

## VertexTraversal
Represents a traversal from a vertex

**Kind**: global class  

* [VertexTraversal](#VertexTraversal)
    * [.out()](#VertexTraversal+out) ⇒ [<code>VertexTraversal</code>](#VertexTraversal)
    * [.outE()](#VertexTraversal+outE) ⇒ [<code>EdgeTraversal</code>](#EdgeTraversal)
    * [.in()](#VertexTraversal+in) ⇒ [<code>VertexTraversal</code>](#VertexTraversal)
    * [.inE()](#VertexTraversal+inE) ⇒ [<code>EdgeTraversal</code>](#EdgeTraversal)
    * [.both()](#VertexTraversal+both) ⇒ [<code>VertexTraversal</code>](#VertexTraversal)
    * [.bothE()](#VertexTraversal+bothE) ⇒ [<code>EdgeTraversal</code>](#EdgeTraversal)

<a name="VertexTraversal+out"></a>

### vertexTraversal.out() ⇒ [<code>VertexTraversal</code>](#VertexTraversal)
**Kind**: instance method of [<code>VertexTraversal</code>](#VertexTraversal)  
<a name="VertexTraversal+outE"></a>

### vertexTraversal.outE() ⇒ [<code>EdgeTraversal</code>](#EdgeTraversal)
**Kind**: instance method of [<code>VertexTraversal</code>](#VertexTraversal)  
<a name="VertexTraversal+in"></a>

### vertexTraversal.in() ⇒ [<code>VertexTraversal</code>](#VertexTraversal)
**Kind**: instance method of [<code>VertexTraversal</code>](#VertexTraversal)  
<a name="VertexTraversal+inE"></a>

### vertexTraversal.inE() ⇒ [<code>EdgeTraversal</code>](#EdgeTraversal)
**Kind**: instance method of [<code>VertexTraversal</code>](#VertexTraversal)  
<a name="VertexTraversal+both"></a>

### vertexTraversal.both() ⇒ [<code>VertexTraversal</code>](#VertexTraversal)
**Kind**: instance method of [<code>VertexTraversal</code>](#VertexTraversal)  
<a name="VertexTraversal+bothE"></a>

### vertexTraversal.bothE() ⇒ [<code>EdgeTraversal</code>](#EdgeTraversal)
**Kind**: instance method of [<code>VertexTraversal</code>](#VertexTraversal)  
<a name="Vertex"></a>

## Vertex
Represents a Vertex Class in the schema.

**Kind**: global class  
**Implements**: [<code>Promise&lt;Vertex&gt;</code>](#Vertex)  

* [Vertex](#Vertex)
    * [.extends(base)](#Vertex+extends)
    * [.property(name, type)](#Vertex+property)
    * [.index(properties, type, name)](#Vertex+index)
    * [.insert(data)](#Vertex+insert) ⇒ [<code>Record</code>](#Record)
    * [.upsert(name, query, data)](#Vertex+upsert)
    * [.traverse(reference)](#Vertex+traverse)

<a name="Vertex+extends"></a>

### vertex.extends(base)
Creates a new class in the schema.

**Kind**: instance method of [<code>Vertex</code>](#Vertex)  

| Param | Type | Description |
| --- | --- | --- |
| base | <code>string</code> | Optional base class |

<a name="Vertex+property"></a>

### vertex.property(name, type)
Creates a new property in the schema. It requires that the class for the property already exist on the database.

**Kind**: instance method of [<code>Vertex</code>](#Vertex)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Defines the logical name for the property. |
| type | <code>string</code> | Defines the property data type. |

<a name="Vertex+index"></a>

### vertex.index(properties, type, name)
Ensures an index exists. If the index already exists, this will not overwrite or reconfigure it.

**Kind**: instance method of [<code>Vertex</code>](#Vertex)  

| Param | Type | Description |
| --- | --- | --- |
| properties | <code>Array.&lt;string&gt;</code> | Array of properties to include in the index |
| type | <code>string</code> | Defines the index type that you want to use. |
| name | <code>string</code> | Optional. Specify the name of the index. |

<a name="Vertex+insert"></a>

### vertex.insert(data) ⇒ [<code>Record</code>](#Record)
Inserts a vertex record

**Kind**: instance method of [<code>Vertex</code>](#Vertex)  

| Param | Type |
| --- | --- |
| data | <code>object</code> | 

<a name="Vertex+upsert"></a>

### vertex.upsert(name, query, data)
Creates or updates a vertex. The resulting vertex would be a combination of query and data.

**Kind**: instance method of [<code>Vertex</code>](#Vertex)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>name</code> | Name of the class |
| query | <code>object</code> | Object containing identifier of the vertex. |
| data | <code>object</code> | Additional properties of the vertex. |

<a name="Vertex+traverse"></a>

### vertex.traverse(reference)
Begins traversal with records

**Kind**: instance method of [<code>Vertex</code>](#Vertex)  

| Param | Type |
| --- | --- |
| reference | [<code>Reference</code>](#Reference) | 

<a name="Record"></a>

## Record
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| @rid | <code>string</code> \| <code>RecordID</code> | 
| @type | <code>&#x27;VERTEX&#x27;</code> \| <code>&#x27;EDGE&#x27;</code> \| <code>null</code> | 

<a name="Reference"></a>

## Reference : <code>string</code> \| <code>RecordID</code> \| [<code>Record</code>](#Record) \| <code>Array.&lt;string&gt;</code> \| <code>Array.&lt;RecordID&gt;</code> \| [<code>Array.&lt;Record&gt;</code>](#Record)
**Kind**: global typedef  
