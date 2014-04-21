json-db [![Build Status](https://travis-ci.org/Jezternz/json-db.svg?branch=master)](https://travis-ci.org/Jezternz/json-db)
=======

A very simple JSON file DB. This was created because I wanted a very simple json storage, that did not rely on a database being installed of any sort. I also wanted the ability to easily export or read as JSON. Primarily for prototyping or small sites.

### API

The operations are very simple.
```javascript
db = new JsonDB({ "fileName": <fileName>, "prettyJSON": <bool(false)>, "tables": { <setName>: <setUniqueFieldKey>, ... } });
[itemsAffected] = db.set(<tableName>, <itemOrArray>, { "throwOnDuplicate" : <bool(false)> });
[itemsAffected] = db.del(<tableName>, <matchObjOrArray>);
[itemMatches] = db.get(<tableName>, <matchObjOrArray>, { "exactMatch": <bool(false)>, caseSensitive": <bool(true)>, "orderBy": <fieldName(null)>, "orderAscending": <bool(false)>, "offset": <number(0)>, "limit": <number(-1)> });

where <matchObjOrArray> is one of:
* Single or array of primary keys in the set
* Single or array of objects to match against, eg: { <fieldName>:<matchValue>, <fieldName2>:<matchValue2>} means retrieve all values where items (fieldName contains matchValue or fieldName2 contains matchValue2)
```

### Notes 
* Operations are persisted synchronously in memory, and to disk asynchronously.
* All tables are essentially sets, and are schema-less except for having a set unique key.
* Being in memory, this will always take up memory equal to the amount stored in the DB.
* This is also presently CPU heavy, as all operations are done in plain functional JS, this could be drastically improved by a C++ implementation.
* Does not currently support concurrent access.

### Example
Hopefully the API is pretty self-explanatory, but if you want a examples, checkout example.js

### Possible Improvements:
* Add indexing for faster search of common searches.
* Write as a C++ plugin to decrease CPU load.
* Consider concurrency (multiple processes access the DB) - locking? 
* Recover from process end (maybe save synchronously when process is going to end)

### Releases
0.0.1 - Basic working package  
0.0.2 - Adding test cases  
0.0.3 - Added many more test cases, updated API and optional search params  
