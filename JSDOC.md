## Classes

<dl>
<dt><a href="#Class">Class</a></dt>
<dd></dd>
<dt><a href="#Client">Client</a></dt>
<dd></dd>
<dt><a href="#Edge">Edge</a></dt>
<dd></dd>
<dt><a href="#Vertex">Vertex</a></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#Record">Record</a></dt>
<dd></dd>
<dt><a href="#Reference">Reference</a> : <code>string</code> | <code>RecordID</code> | <code><a href="#Record">Record</a></code> | <code>Array.&lt;string&gt;</code> | <code>Array.&lt;RecordID&gt;</code> | <code><a href="#Record">Array.&lt;Record&gt;</a></code></dt>
<dd></dd>
</dl>

<a name="Class"></a>

## Class
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
    * [.select(query)](#Class+select)
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

<a name="Class+select"></a>

### class.select(query)
Begins traversal with query

**Kind**: instance method of [<code>Class</code>](#Class)  

| Param | Type |
| --- | --- |
| query | <code>object</code> | 

<a name="Class+traverse"></a>

### class.traverse(reference)
Begins traversal with records

**Kind**: instance method of [<code>Class</code>](#Class)  

| Param | Type |
| --- | --- |
| reference | [<code>Reference</code>](#Reference) | 

<a name="Client"></a>

## Client
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

<a name="Edge"></a>

## Edge
**Kind**: global class  
**Implements**: [<code>Promise&lt;Edge&gt;</code>](#Edge)  

* [Edge](#Edge)
    * [.extends(base)](#Edge+extends)
    * [.property(name, type)](#Edge+property)
    * [.index(properties, type, name)](#Edge+index)
    * [.insert(from, to, data)](#Edge+insert) ⇒ [<code>Record</code>](#Record)
    * [.upsert(from, to, data)](#Edge+upsert) ⇒ [<code>Record</code>](#Record)
    * [.select(query)](#Edge+select)
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

<a name="Edge+select"></a>

### edge.select(query)
Begins traversal with query

**Kind**: instance method of [<code>Edge</code>](#Edge)  

| Param | Type |
| --- | --- |
| query | <code>object</code> | 

<a name="Edge+traverse"></a>

### edge.traverse(reference)
Begins traversal with records

**Kind**: instance method of [<code>Edge</code>](#Edge)  

| Param | Type |
| --- | --- |
| reference | [<code>Reference</code>](#Reference) | 

<a name="Vertex"></a>

## Vertex
**Kind**: global class  
**Implements**: [<code>Promise&lt;Vertex&gt;</code>](#Vertex)  

* [Vertex](#Vertex)
    * [.extends(base)](#Vertex+extends)
    * [.property(name, type)](#Vertex+property)
    * [.index(properties, type, name)](#Vertex+index)
    * [.insert(data)](#Vertex+insert) ⇒ [<code>Record</code>](#Record)
    * [.upsert(name, query, data)](#Vertex+upsert)
    * [.select(query)](#Vertex+select)
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

<a name="Vertex+select"></a>

### vertex.select(query)
Begins traversal with query

**Kind**: instance method of [<code>Vertex</code>](#Vertex)  

| Param | Type |
| --- | --- |
| query | <code>object</code> | 

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
