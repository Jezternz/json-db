var
    fs = require("fs");

/* 

TODO: 
    * Deisnged for Uber Simplicitivity
    * In readme emphasise the fact this is designed for a single process / script acess.
    * Explain this is excelent for prototyping
    * Maybe write a basic rest server, no auth. -- how to handel uploads?




    json-db API:

    var db = new JsonDB.DB({ "fileName": "db.json", "prettyJSON": false, "tables": { tableName: tableUniqueId, ... } });
    
    db.set(tableName, itemOrItems, { newOnly : false });

    db.del(tableName, matchObjOrArr);

    db.get(tableName, matchObjOrAr, { search: false, offset: 0, limit: -1 });

*/

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

    var loadFromFile = function()
    {
        try
        {
            if(fs.existsSync(options.fileName))
            {
                var strDB = fs.readFileSync(options.fileName, fOptions);
                if(strDB.trim().length>0)
                {
                    inMemoryDB = JSON.parse(strDB);
                }
                else
                {
                    inMemoryDB = {};
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

    var tableExists = function(tableName)
    {
        return typeof inMemoryDB[tableName] !== "undefined";
    };

    // Ensure an array of searchObjects, also ensure every searchObject is an "object" (and convert to object from string if need be, do this using exactMatch)
    var sanatizeMatchObject = function(tableName, matchObjOrAr)
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
        return matchObjOrAr.map(function(searchObj)
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
                        newSearchObj[innerSearchKey] = searchObj[innerSearchKey];
                    }
                });
            }
            else
            {
                newSearchObj[inMemoryDB[tableName].key] = searchObj;
            }
            return newSearchObj;
        });
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
            return orderArray.sort(function(a,b){ return a.name > b.name ? 1 : -1; });
        }
        else
        {
            return orderArray.sort(function(a, b){ return a.name > b.name ? -1 : 1; });
        }
    };

    var offsetAndLimitArrayBy = function(matchingItems, offset, limit)
    {
        var offset = typeof offset === "number" ? offset : 0;
        var limit = typeof limit === "number" ? limit : -1;
        if(limit !== -1)
        {
            return matchingItems.slice(offset, limit);
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
        else if(opts.exactMatch)
        {
            matchingItems = inMemoryDB[tableName].items.filter(function(item)
            {
                // Compare with each searchObj
                return matchObjOrAr.some(function(searchObj)
                {
                    // If any search values are contained in item values
                    return Object.keys(searchObj).some(function(compareKey)
                    { 
                        return item[compareKey] + "" === searchObj[compareKey] + ""; 
                    });
                });
            });
        }
        else
        {
            matchingItems = inMemoryDB[tableName].items.filter(function(item)
            {
                // Compare with each searchObj
                return matchObjOrAr.some(function(searchObj)
                {
                    // If any search values are contained in item values
                    return Object.keys(searchObj).some(function(compareKey)
                    { 
                        return (
                            item[compareKey] === searchObj[compareKey] || 
                            (item[compareKey]+"").indexOf(searchObj[compareKey]) !== -1
                        ); 
                    });
                });
            });
        }
        if(typeof opts.orderBy === "string" && opts.orderBy.length > 0)
        {
            matchingItems = orderArrayBy(matchingItems, opts.orderBy, !!opts.orderAscending);
        }
        if(typeof opts.offset === "number" || typeof opts.limit === "number")
        {
            matchingItems = offsetAndLimitArrayBy(matchingItems, opts.offset, opts.limit);
        }
        return copy(matchingItems);
    };

    var removeItems = function(tableName, matchObjOrAr)
    {
        var arrayOut = [];
        var matchingIndices = inMemoryDB[tableName].items
            .map(function(item, i)
            {
                // Compare with each searchObj
                var match = matchObjOrAr.some(function(searchObj)
                {
                    // If any search values are contained in item values
                    return Object.keys(searchObj).some(function(compareKey){ return (item[compareKey]+"").indexOf(searchObj[compareKey]) !== -1; });
                });
                return match ? i : -1;
            })
            .filter(function(indx){ return indx !== -1; });
        matchingIndices.reverse().forEach(function(indx)
        {
            arrayOut = arrayOut.concat(inMemoryDB[tableName].items.splice(indx, 1));
        });
        return copy(arrayOut);
    };

    // db = new JsonDB({ "fileName": <fileName>, "prettyJSON": <bool(false)>, "tables": { <setName>: <setUniqueFieldKey>, ... } });
    var constructor = function(opts)
    {
        options = copy(defaultOpts);
        inMemoryDB = {};
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

        Object.keys(options.tables)
            .filter(function(tableName)
            {
                return (typeof inMemoryDB[tableName] === "undefined");
            })
            .forEach(function(tableName)
            {
                inMemoryDB[tableName] = { "items": [], "indices": [], "key": options.tables[tableName], "indexCounter": 0 };
            });

        saveToFile(true);
    };

    // db.set(<tableName>, <itemOrArray>, { "newOnly" : <bool(false)> });
    this.set = function(tableName, itemOrItems, opts)
    {
        // At least 2 args!! else throw
        if(arguments.length < 2)
        {
            error("Invalid arguments, you must use format db.update(<tableName>, <itemOrItems>, <acceptNewItems>)");
        }
        if(!tableExists(tableName))
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

    // db.get(<tableName>, <matchObjOrArray>, { "exactMatch": <bool(false)>, caseSensitive": <bool(true)>, "orderBy": <fieldName(null)>, "orderAscending": <bool(false)>, "offset": <number(0)>, "limit": <number(-1)> });
    this.get = function(tableName, matchObjOrAr, opts)
    {
        if(arguments.length < 1)
        {
            error("Invalid arguments, you must use format db.get(<tableName>, <matchObjOrAr>)");
        }
        if(!tableExists(tableName))
        {
            error("Table '" + tableName + '" does not exist.');
        }

        // setup default options
        opts = opts || {};
        opts.exactMatch = typeof opts.exactMatch === "boolean" ? opts.exactMatch : false;
        opts.caseSensitive = typeof opts.caseSensitive === "boolean" ? opts.caseSensitive : false;
        opts.orderBy = typeof opts.orderBy === "string" ? opts.orderBy : null;
        opts.offset = typeof opts.offset === "number" ? opts.offset : 0;
        opts.limit = typeof opts.limit === "number" ? opts.limit : -1;

        // if supplying a bunch of indexes, search for exact matches.
        if(typeof matchObjOrAr === "string" || (Array.isArray(matchObjOrAr) && typeof matchObjOrAr[0] === "string"))
        {
            opts.exactMatch = true;
        }

        // Get search matches
        matchObjOrAr = sanatizeMatchObject(tableName, matchObjOrAr);
        return findItems(tableName, matchObjOrAr, opts);
    };

    // db.del(<tableName>, <matchObjOrArray>);
    this.del = function(tableName, matchObjOrAr)
    {
        if(arguments.length < 1)
        {
            error("Invalid arguments, you must use format db.del(<tableName>, <matchObjOrAr>)");
        }
        if(!tableExists(tableName))
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
            matchObjOrAr = sanatizeMatchObject(tableName, matchObjOrAr);
            removedItems = removeItems(tableName, matchObjOrAr);
        }
        saveToFile();
        return removedItems;
    };
    
    constructor.apply(this, arguments);

};