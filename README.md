LocalJsonDB [![Build Status](https://travis-ci.org/Jezternz/localjsondb.svg?branch=master)](https://travis-ci.org/Jezternz/localjsondb)
=======

A very simple local json file database for Node.js that can be used for prototyping and small projects. 

---

The API includes only 3 operations (.get(), .set(), .del()), designed for basic addition, removal, retrieval and filtering with pagination. A helper method is also provided (.expressRouting()) that can be used as express middleware, this enables a simple REST service with get, post, put and delete operations corresponding to the methods previously mentioned. 

All operations work synchronously on the database in memory, and asynchonously save changes to a json file.

Tables are essentially just lists of JSON objects. The rows are schemaless and require only a single field to be a unique key. The current implementation does not support concurrent access.
### Installation
```
npm install localjsondb
```

### API
```javascript
db = new LocalJsonDB({ "fileName": <fileName>, "prettyJSON": <bool(false)>, "tables": { <setName>: <setUniqueFieldKey>, ... } });

[itemsAffected] = db.set(<tableName>, <itemOrArray>, { "throwOnDuplicate" : <bool(false)> });
[itemsAffected] = db.del(<tableName>, <matchObjOrArray>);
[itemMatches] = db.get(<tableName>, <matchObjOrArray>, { "exactMatch": <bool(false)>, "ignoreCase": <bool(false)>, "orderBy": <fieldName(null)>, "orderAscending": <bool(false)>, "offset": <number(0)>, "limit": <number(-1)> });
[expressAllHandler] = db.expressRouting();

where <matchObjOrArray> is one of:
* Single or array of unique keys in the target table.
* Single or array of objects to match against, eg: { <fieldName>:<matchValue>, <fieldName2>:<matchValue2>} means retrieve all values where rows (fieldName contains matchValue or fieldName2 contains matchValue2)
```

### Examples  
*tests/test.js* - advanced usage examples.  
*examples/example-basic.js* - basic usage examples.  
*examples/example-express.js* - real use case example hosting the API using express, and an htm client to talk to it with.  

### Improvements
* Write as a C++ plugin to decrease CPU load.
* Investigate ways to fix concurrency issues.
* In the actual search function, could count number of matches instead of returning on first match, to enable sort by relevance.
* Recover from process end (maybe save synchronously when process is going to end)

### Releases
0.0.1 - Basic working package  
0.0.2 - Adding test cases  
0.0.3 - Added many more test cases, updated API and optional search params  
0.0.4 - Updated to include a basic Express routing method.
