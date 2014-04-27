json-db [![Build Status](https://travis-ci.org/Jezternz/json-db.svg?branch=master)](https://travis-ci.org/Jezternz/json-db)
=======

A very simple JSON file Database. This was created because I wanted a very simple json storage, that did not rely on a database being installed of any sort. I also wanted the ability to easily export or read as flat JSON. Primarily developed with prototyping or small sites in mind.

### API

NodeJs basic usage
```javascript
db = new JsonDB({ "fileName": <fileName>, "prettyJSON": <bool(false)>, "tables": { <setName>: <setUniqueFieldKey>, ... } });
[itemsAffected] = db.set(<tableName>, <itemOrArray>, { "throwOnDuplicate" : <bool(false)> });
[itemsAffected] = db.del(<tableName>, <matchObjOrArray>);
[itemMatches] = db.get(<tableName>, <matchObjOrArray>, { "exactMatch": <bool(false)>, "ignoreCase": <bool(false)>, "orderBy": <fieldName(null)>, "orderAscending": <bool(false)>, "offset": <number(0)>, "limit": <number(-1)> });

where <matchObjOrArray> is one of:
* Single or array of unique keys in the target table.
* Single or array of objects to match against, eg: { <fieldName>:<matchValue>, <fieldName2>:<matchValue2>} means retrieve all values where rows (fieldName contains matchValue or fieldName2 contains matchValue2)
```

## Quick and easy JSON Rest interface
Also included is one extra method 'db.expressRouting()', this method is a convienience method maintained in a separate file to the rest of the JsonDB code (jsondb-express.js) and allows a developer to very quickly setup a basic rest interface to access their json file. To add authentication, access limitations or data sanatization yourself, you must add this manually, possibly using express middleware.
The example below shows a very basic setup.
Refer to 'example-express.js' for a good example that also includes a web client.

NodeJs with express for an easy REST interface
```javascript
var app = require('express')();
app.use(bodyParser.json());
app.all('/api/*', db.expressRouting());
app.listen(3000);
```

API Endpoints:
```
GET /api/<tableName>?{opts}
GET /api/<tableName>/<uniqueId>
POST /api/<tableName> (uses body for single or list of objects, for batch addition)
PUT /api/<tableName> (uses body for list of objects, for batch updates)
PUT /api/<tableName>/<uniqueId>
DELETE /api/<tableName> (uses body for list of ids, for batch deletion)
DELETE /api/<tableName>/<uniqueId>
```

### Notes 
* Operations are persisted synchronously in memory, and to disk asynchronously.
* All tables are essentially sets, and are schema-less except for having a set unique key.
* Being in memory, this will always take up memory equal to the amount stored in the DB.
* This is also presently CPU heavy, as all operations are done in plain functional JS, this could be drastically improved by a C++ implementation.
* Implementation does not currently support concurrent access.

### Examples
Hopefully the API is pretty self-explanatory  
For basic examples refer to example-basic.js and test.js for more advanced examples.  
For examples of how to setup a rest api refer to example-express.js, middleware can easily be added to deal with auth & data sanatization.

### Possible Improvements:
* In the actual search function, could count number of matches instead of returning on first match, to enable sort by relevance.
* Write as a C++ plugin to decrease CPU load.
* Consider concurrency (multiple processes access the DB) - locking? 
* Recover from process end (maybe save synchronously when process is going to end)
* Add indexing for faster search of common searches.

### Releases
0.0.1 - Basic working package  
0.0.2 - Adding test cases  
0.0.3 - Added many more test cases, updated API and optional search params  
0.0.4 - Updated to include a basic Express routing method.