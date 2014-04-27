/*
    
    JsonDB (Local JSON storage)

    https://github.com/Jezternz/json-db
    by Joshua McLauchlan 2014

*/

var
    expressJsonDB = require("./jsondb-express.js"),
    fs = require("fs");

module.exports = function()
{
    var defaultOpts = {
        "fileName": "db.json",
        "prettyJSON": false,
        "tables": {}
    };

    var 
        _self = this,
        options,
        fOptions = {"encoding": "utf8"},
        inMemoryDB = {},
        pendingSave = false,
        saving = false;

    var createRegExp = function(str, exactMatch, ignoreCase)
    {
        str = str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        if(exactMatch)
        {
            str = "^" + str + "$";
        }
        return new RegExp(str, ignoreCase ? "i" : "");
    };

    var saveToFile = function(sync)
    {
        if(sync)
        {
            var data = options.prettyJSON ? JSON.stringify(inMemoryDB, null, "  ") : JSON.stringify(inMemoryDB);
            fs.writeFileSync(options.fileName, data, fOptions);
            return;
        }
        if(saving)
        {
            pendingSave = true;
        }
        else
        {
            saving = true;
            var data = options.prettyJSON ? JSON.stringify(inMemoryDB, null, "  ") : JSON.stringify(inMemoryDB);
            fs.writeFile(options.fileName, data, fOptions, function()
            {
                saving = false;
                if(pendingSave)
                {
                    pendingSave = false;
                    saveToFile();
                }
            }); 
        }
    };

    var checkIndices = function(db)
    {
        for(var tableName in db)
        {
            var tableKey = db[tableName].key;
            if(!tableKey)
            {
                tableKey = "_Replace_this_with_unique_key_";
                if(db[tableName].items && db[tableName].items[0] && typeof db[tableName].items[0] === "object")
                {
                    var possibleKey = Object.keys(db[tableName].items[0]).pop();
                    tableKey = possibleKey || id;
                }
                db[tableName].key = tableKey;
                console.warn("[DB parse warning] Table '" + tableName + "' - Missing table unique key name, attempting repair. Setting keyname to '" + tableKey + "'");
            }
            if(!db[tableName].indices)
            {
                db[tableName].indexCounter = 0;
                db[tableName].indices = [];
                console.warn("[DB parse warning] Table '" + tableName + "' - Missing table indices array, attempting repair. Creating indices array.");
            }
            var indices = db[tableName].indices.sort();
            var itemKeys = db[tableName].items.map(function(it){ return (it && it[tableKey]) ? it[tableKey].toString() : "-1"; }).sort();
            if(JSON.stringify(indices) !== JSON.stringify(itemKeys))
            {
                db[tableName].indexCounter = 0;
                db[tableName].indices = db[tableName].items.map(function(it)
                { 
                    return (it && it[tableKey]) ? it[tableKey].toString() : "-1"; 
                })
                console.warn("[DB parse error] Table '" + tableName + "' - Missing indices for items, attempting repair. Regenerated indices using key '" + tableKey + "'");
            }
        }
        return db;
    };

    var loadFromFile = function()
    {
        try
        {
            if(fs.existsSync(options.fileName))
            {
                var strDB = fs.readFileSync(options.fileName, fOptions);
                for(var key in inMemoryDB)
                {
                   delete inMemoryDB[key];
                }
                if(strDB.trim().length>0)
                {
                    var newMemoryDB = checkIndices(JSON.parse(strDB));
                    for(var key in newMemoryDB)
                    {
                       inMemoryDB[key] = newMemoryDB[key];
                    }
                }
            }
        }
        catch(er)
        {
            error("Failed to parse "+ options.fileName + " , error: "+ er);
        }
    };

    var error = function(str)
    {
        throw new Error("[jsonDB] " + str);
    };

    var copy = function(obj)
    {
        return JSON.parse(JSON.stringify(obj));
    };

    // Ensure an array of searchObjects, also ensure every searchObject is an "object" (and convert to object from string if need be, do this using exactMatch)
    var sanatizeMatchObject = function(tableName, matchObjOrAr, opts)
    {
        if(typeof matchObjOrAr === "undefined" || matchObjOrAr === false || matchObjOrAr === null)
        {
            return false;
        }
        matchObjOrAr = Array.isArray(matchObjOrAr) ? matchObjOrAr : [matchObjOrAr];
        if(matchObjOrAr.some(function(searchObj){ return typeof searchObj === "undefined"; }))
        {
            error("Invalid search object '" + JSON.stringify(searchObj) + "', of type '" + (typeof searchObj) + "', expected string or object.");
        };
        var matchObjOrArSanatized = [];
        matchObjOrAr.forEach(function(searchObj)
        {
            var newSearchObj = {};
            if(typeof searchObj === "object")
            {
                Object.keys(searchObj).forEach(function(innerSearchKey)
                {
                    if(typeof searchObj[innerSearchKey] === "object" || !searchObj[innerSearchKey].toString)
                    {
                        error("Invalid search object '" + JSON.stringify(searchObj[innerSearchKey]) + "', of type '" + (typeof searchObj[innerSearchKey]) + "', expected string or object.");
                    }
                    else
                    {
                        newSearchObj[innerSearchKey] = (typeof searchObj[innerSearchKey] === "object" ? JSON.stringify(searchObj[innerSearchKey]) : searchObj[innerSearchKey]+"");
                    }
                });
            }
            else
            {
                newSearchObj[inMemoryDB[tableName].key] = (typeof searchObj === "object" ? JSON.stringify(searchObj) : searchObj+"");
            }
            for(var searchKey in newSearchObj)
            {
                matchObjOrArSanatized.push([searchKey, createRegExp(newSearchObj[searchKey], opts.exactMatch, opts.ignoreCase)]);
            }
        });
        return matchObjOrArSanatized;
    };

    var addItems = function(tableName, itemOrItems)
    {        
        var keyName = inMemoryDB[tableName].key;
        var arrayOut = [];
        // Update & Add
        itemOrItems.forEach(function(newItem)
        {
            if(typeof newItem[keyName] === "undefined")
            {
                // Find a new Id
                do
                {
                    newItem[keyName] = (inMemoryDB[tableName].indexCounter++);
                }
                while(inMemoryDB[tableName].indices.indexOf(newItem[keyName].toString()) !== -1);
            }
            if(inMemoryDB[tableName].indices.indexOf(newItem[keyName].toString()) !== -1)
            {
                var match = inMemoryDB[tableName].items.filter(function(row){ return row[keyName] === newItem[keyName]; }).pop();
                Object.keys(newItem).forEach(function(newItemKey)
                {
                    match[newItemKey] = newItem[newItemKey];
                });
                arrayOut.push(match);
            }
            else
            {
                inMemoryDB[tableName].indices.push(newItem[keyName].toString());
                inMemoryDB[tableName].items.push(copy(newItem));
                arrayOut.push(newItem);
            }
        });
        return copy(arrayOut);
    }

    var orderArrayBy = function(orderArray, orderByField, orderAsc)
    {
        if(orderAsc)
        {
            return orderArray.sort(function(a,b){ return a[orderByField] > b[orderByField] ? 1 : -1; });
        }
        else
        {
            return orderArray.sort(function(a, b){ return a[orderByField] > b[orderByField] ? -1 : 1; });
        }
    };

    var offsetAndLimitArrayBy = function(matchingItems, offset, limit)
    {
        var offset = typeof offset === "number" ? offset : 0;
        var limit = typeof limit === "number" ? limit : -1;
        if(limit !== -1)
        {
            return matchingItems.slice(offset, offset+limit);
        }
        else
        {
            return matchingItems.slice(offset);
        }
    };

    var findItems = function(tableName, matchObjOrAr, opts)
    {
        var matchingItems;
        if(matchObjOrAr === false)
        {
            matchingItems = inMemoryDB[tableName].items;
        }
        else 
        {
            // Perform tests to find relevant matches
            matchingItems = [];
            var itemsLen = inMemoryDB[tableName].items.length, matchObjOrArLength = matchObjOrAr.length;
            for(var i=0;i<itemsLen;i++)
            {
                for(var j=0;j<matchObjOrArLength;j++)
                {
                    if(matchObjOrAr[j][1].test(typeof inMemoryDB[tableName].items[i][matchObjOrAr[j][0]] === "object" ? JSON.stringify(inMemoryDB[tableName].items[i][matchObjOrAr[j][0]]) : inMemoryDB[tableName].items[i][matchObjOrAr[j][0]]+""))
                    {
                        matchingItems.push(inMemoryDB[tableName].items[i]);
                        break;
                    }
                }
            }
        }
        if(typeof opts.orderBy === "string" && opts.orderBy.length > 0)
        {
            matchingItems = orderArrayBy(matchingItems, opts.orderBy, opts.orderAscending);
        }
        if(typeof opts.offset === "number" || typeof opts.limit === "number")
        {
            matchingItems = offsetAndLimitArrayBy(matchingItems, opts.offset, opts.limit);
        }
        return copy(matchingItems);
    };

    var removeItems = function(tableName, matchObjOrAr)
    {
        var matchingItems = [], removeAr = [], itemsLen = inMemoryDB[tableName].items.length, matchObjOrArLength = matchObjOrAr.length;
        for(var i=0;i<itemsLen;i++)
        {
            for(var j=0;j<matchObjOrArLength;j++)
            {
                if(matchObjOrAr[j][1].test(typeof inMemoryDB[tableName].items[i][matchObjOrAr[j][0]] === "object" ? JSON.stringify(inMemoryDB[tableName].items[i][matchObjOrAr[j][0]]) : inMemoryDB[tableName].items[i][matchObjOrAr[j][0]]+""))
                {
                    removeAr.push(i);
                    break;
                }
            }
        }
        for(i=removeAr.length-1; i>=0; i--)
        {
            var uniqueKey = inMemoryDB[tableName].items[removeAr[i]][inMemoryDB[tableName].key].toString();
            inMemoryDB[tableName].indices.splice(inMemoryDB[tableName].indices.indexOf(uniqueKey), 1);
            matchingItems = matchingItems.concat(inMemoryDB[tableName].items.splice(removeAr[i], 1));
        }
        return copy(matchingItems);
    };

    // db = new JsonDB({ "fileName": <fileName>, "prettyJSON": <bool(false)>, "tables": { <setName>: <setUniqueFieldKey>, ... } });
    var constructor = function(opts)
    {
        options = copy(defaultOpts);
        pendingSave = false;

        opts = typeof opts === "object" ? opts : {};

        Object.keys(opts).forEach(function(optKey)
        {
            if(typeof options[optKey] !== "undefined")
            {
                options[optKey] = opts[optKey];
            }
            else
            {
                error("Unknown setting '" + optKey + "' * Note setting names are case sensitive.");
            }
        });
        loadFromFile();
        this._addTables(options.tables);
    };

    this._addTables = function(tableObj)
    {
        if(typeof tableObj === "object")
        {
            Object.keys(tableObj)
                .filter(function(tableName)
                {
                    return (typeof tableName === "string" && typeof tableObj[tableName] === "string") && (typeof inMemoryDB[tableName] === "undefined");
                })
                .forEach(function(tableName)
                {
                    inMemoryDB[tableName] = { "items": [], "indices": [], "key": tableObj[tableName], "indexCounter": 0 };
                });
            saveToFile(true);
        }
    };

    this._removeTables = function(tableNames)
    {
        if(Array.isArray(tableNames))
        {
            Object.keys(tableNames)
                .filter(function(tableName)
                {
                    return (typeof inMemoryDB[tableName] === "undefined");
                })
                .forEach(function(tableName)
                {
                    delete inMemoryDB[tableName];
                });
            saveToFile(true);
        }
    };

    this._tableExists = function(tableName)
    {
        return typeof inMemoryDB[tableName] !== "undefined";
    };

    this._getTableKey = function(tableName)
    {
        if(this._tableExists(tableName))
        {
            return inMemoryDB[tableName].key;
        }
        else
        {
            console.warn("Table with name '", tableName, '" does not exist, so table key cannot be retrieved.');
            return false;
        }
    };

    this._listTables = function()
    {
        var tables = {};
        Object.keys(inMemoryDB).forEach(function(tableName)
        {
            tables[tableName] = inMemoryDB[tableName].key;
        });
        return tables;
    }

    // db.set(<tableName>, <itemOrArray>, { "newOnly" : <bool(false)> });
    this.set = function(tableName, itemOrItems, opts)
    {
        // At least 2 args!! else throw
        if(arguments.length < 2)
        {
            error("Invalid arguments, you must use format db.update(<tableName>, <itemOrItems>, <acceptNewItems>)");
        }
        if(!this._tableExists(tableName))
        {
            error("Table '" + tableName + '" does not exist.');
        }
        opts = opts || {};
        opts.acceptNewItems = typeof opts.acceptNewItems === "boolean" ? opts.acceptNewItems : true;
        itemOrItems = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
        itemOrItems = itemOrItems.filter(function(item){ return typeof item === "object" && item !== null; });
        if(itemOrItems.length === 0)
        {
            // Silently do not set if there are no objects that are objects.
            return;
        }
        var keyName = inMemoryDB[tableName].key;
        if(!opts.acceptNewItems)
        {
            if(itemOrItems.some(function(item){ return (inMemoryDB[tableName].indices.indexOf(item[keyName].toString()) !== -1); }))
            {
                error("One or more of the objects for update did not exist, and newOnly was set to false.");
            }
        }
        var addedItems = addItems(tableName, itemOrItems);
        saveToFile();
        return addedItems;
    }

    // db.get(<tableName>, <matchObjOrArray>, { "exactMatch": <bool(false)>, "ignoreCase": <bool(false)>, "orderBy": <fieldName(null)>, "orderAscending": <bool(false)>, "offset": <number(0)>, "limit": <number(-1)> });
    this.get = function(tableName, matchObjOrAr, opts)
    {
        if(arguments.length < 1)
        {
            error("Invalid arguments, you must use format db.get(<tableName>, <matchObjOrAr>)");
        }
        if(!this._tableExists(tableName))
        {
            error("Table '" + tableName + '" does not exist.');
        }

        // setup default options
        opts = opts || {};
        opts.exactMatch = typeof opts.exactMatch === "boolean" ? opts.exactMatch : false;
        opts.ignoreCase = typeof opts.ignoreCase === "boolean" ? opts.ignoreCase : false;
        opts.orderAscending = typeof opts.orderAscending === "boolean" ? opts.orderAscending : false;
        opts.orderBy = typeof opts.orderBy === "string" ? opts.orderBy : null;
        opts.offset = typeof opts.offset === "number" ? opts.offset : 0;
        opts.limit = typeof opts.limit === "number" ? opts.limit : -1;

        // if supplying a bunch of indexes, search for exact matches.
        if(typeof matchObjOrAr === "string" || (Array.isArray(matchObjOrAr) && typeof matchObjOrAr[0] === "string"))
        {
            opts.exactMatch = true;
        }

        // Get search matches
        matchObjOrAr = sanatizeMatchObject(tableName, matchObjOrAr, opts);
        return findItems(tableName, matchObjOrAr, opts);
    };

    // db.del(<tableName>, <matchObjOrArray>);
    this.del = function(tableName, matchObjOrAr)
    {
        if(arguments.length < 1)
        {
            error("Invalid arguments, you must use format db.del(<tableName>, <matchObjOrAr>)");
        }
        if(!this._tableExists(tableName))
        {
            error("Table '" + tableName + '" does not exist.');
        }
        var removedItems;
        if(arguments.length < 2)
        {
            // Do a clear of the table, no matchObjOrAr was set
            removedItems = inMemoryDB[tableName].items;
            inMemoryDB[tableName].items = [];
            inMemoryDB[tableName].indices = [];
            inMemoryDB[tableName].indexCounter = 0;
        }
        else
        {
            matchObjOrAr = sanatizeMatchObject(tableName, matchObjOrAr, { "exactMatch": true, "ignoreCase" : false });
            removedItems = removeItems(tableName, matchObjOrAr);
        }
        saveToFile();
        return removedItems;
    };

    this.expressRoute = expressJsonDB(_self);
    
    constructor.apply(this, arguments);

};