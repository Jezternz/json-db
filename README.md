LocalJsonDB [![Build Status](https://travis-ci.org/Jezternz/localjsondb.svg?branch=master)](https://travis-ci.org/Jezternz/localjsondb)
=======

A very simple local json file database for Node.js that can be used for prototyping and small projects. 

---

The API includes only 3 operations (.get(), .set(), .del()), designed for basic addition, removal, retrieval and filtering with pagination. All operations work synchronously on the database in memory, and asynchonously save changes to a json file. The current implementation does not support concurrent access.

Tables are essentially just lists of JSON objects where rows are schemaless and require only a single field (a unique key). 

A helper method is also provided (.expressRouting()) that can be used as express middleware, this enables a simple rest api service with get, post, put and delete operations corresponding to the methods previously mentioned. Items are accessed at a configured endpoint eg 'api/[tableName]/' or 'api/[tableName]/[uniqueId]/'. Items in the db can be accessed in batch by using the body of a post or put.
### Installation
npm package: https://www.npmjs.com/package/localjsondb
```
npm install localjsondb
npm install express body-parser // (optional - to use express with rest api)
```

### API
```javascript
db = new LocalJsonDB({ "fileName": <fileName>, "prettyJSON": <bool(false)>, "tables": { <setName>: <setUniqueFieldKey>, ... } });

[itemsAffected] = db.set(<tableName>, <itemOrArray>, { "throwOnDuplicate" : <bool(false)> });
[itemsAffected] = db.del(<tableName>, <uniqueIdOrArray>);
[itemMatches] = db.get(<tableName>, <matchObjOrArray>, { "exactMatch": <bool(false)>, "ignoreCase": <bool(false)>, "orderBy": <fieldName(null)>, "orderAscending": <bool(false)>, "offset": <number(0)>, "limit": <number(-1)> });
[expressAllHandler] = db.expressRouting();

where <matchObjOrArray> is one of:
* Single or array of unique keys in the target table.
* Single or array of objects to match against, eg: { <fieldName>:<matchValue>, <fieldName2>:<matchValue2>} means retrieve all values where rows (fieldName contains matchValue or fieldName2 contains matchValue2)
```

### Examples  
*tests/test.js* - advanced usage examples.  
*examples/example-basic.js* - basic usage examples.  
*examples/example-express.js* - real use case example hosting the rest api with express, and an html client to talk to it with.  

### Run the express example:
```
npm install express body-parser localjsondb
node node_modules/localjsondb/examples/example-express.js
```
Then browse to localhost:8080:  
![LocalJsonDB example with express example](https://raw.githubusercontent.com/Jezternz/localjsondb/master/examples/express-example.png)

### Improvements
* Write as a C++ plugin to improve performance beyond what Node.js can offer.
* Investigate ways to allow concurrent access.
* Improve search when sorting to sort by relevance.
* Recover from process end (maybe save synchronously when process is going to end)

### Releases
0.0.1 - Basic working package.  
0.0.2 - Adding test cases.  
0.0.3 - Added many more test cases, updated API and optional search params.  
0.0.4 - Updated to include a basic Express routing method.  
0.1.0 - Minor changes, ready for npm publish.   
0.1.1 - Minor changes, fixed issue with auto-increment of index when it is not provided.  
0.1.2 - Minor changes, fixed issue when using integers vs strings as table indices. 
