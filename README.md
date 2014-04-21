json-db [![Build Status](https://travis-ci.org/Jezternz/json-db.svg?branch=master)](https://travis-ci.org/Jezternz/json-db)
=======

A VERY simple JSON file DB. This was created because I wanted a very simple json storage, that did not rely on a database being installed of any sort. I also wanted the ability to easily export or read as JSON.

This was designed with two use cases in mind. The first being for prototyping sites, the second being for small sites that have few users or at the very least where data is not changed frequently.

The store is kept in memory to make it very fast to add / remove / get items and works synchronously. Items are loaded from JSON when a DB Class is constructed, Item changes are persisted to disk asynchronously. All items stored in the database, are stored in 'tables', which are essentially sets. sets have no schema, but must have one field for a unique key (that must not be of object type).

Notes: 
* Being in memory, this will always take up memory equal to the amount stored in the DB. This is not designed for millions of records being accessed all the time, but should be fine for thousands.
* This is also presently CPU heavy, as all operations are done in plain functional JS, this could be drastically improved by a C++ implementation.
* Does not currently support concurrent access.

### API

The operations are very simple.
* db = new JsonDB({ "fileName": <fileName>, "prettyJSON": <bool(false)>, "tables": { <setName>: <setUniqueFieldKey>, ... } });
* [itemsAffected] = db.set(<tableName>, <itemOrArray>, { "throwOnDuplicate" : <bool(false)> });
* [itemsAffected] = db.del(<tableName>, <matchObjOrArray>);
* [itemMatches] = db.get(<tableName>, <matchObjOrArray>, { "exactMatch": <bool(false)>, caseSensitive": <bool(true)>, "orderBy": <fieldName(null)>, "orderAscending": <bool(false)>, "offset": <number(0)>, "limit": <number(-1)> });

where <matchObjOrArray> is one of:
* Single or array of primary keys in the set
* Single or array of objects to match against, eg: { <fieldName>:<matchValue>, <fieldName2>:<matchValue2>} means retrieve all values where items (fieldName contains matchValue or fieldName2 contains matchValue2)

### Complete Example (everything you need to know):
Hopefully the API is pretty self-explanatory, but if you want a examples, checkout example.js

### Possible Improvements:
* Possibly add ability to index columns, speed up search, or even automatically index popular searches?
* Write plugin as a C++ plugin.
* Consider concurrency (multiple processes access the DB) - locking? 
* Recover from process end (maybe save synchronously when process is going to end)

### Releases
0.1 - Basic working package
0.2 - Adding test cases
0.3 - Added many more test cases, updated API and optional search params 