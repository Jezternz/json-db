var
    fs = require("fs");

exports.DB = function()
{
    var options = {
        "fileName": "db.json",
        "prettyJSON": false,
        "tables": {}
    };

    var 
        _self = this,
        fOptions = {"encoding": "utf8"},
        inMemoryDB = {},
        pendingSave = false,
        saving = false;

    var saveToFile = function()
    {
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
                inMemoryDB = JSON.parse(strDB);
            }
        }
        catch(er)
        {
            throw new Error("Failed to parse "+ options.fileName + " , error: "+ er);
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
    var sanatizeMatchObject = function(tableName, matchObjOrAr, exactMatch)
    {
        matchObjOrAr = Array.isArray(matchObjOrAr) ? matchObjOrAr : [matchObjOrAr];
        return matchObjOrAr.map(function(searchObj)
        {
            if(typeof searchObj === "string")
            {
                var temp = {};
                if(exactMatch)
                {
                    temp[inMemoryDB[tableName].key] = searchObj;
                }
                else
                {
                    if(inMemoryDB[tableName].items.length > 0)
                    {
                        var firstItemKeys = Object.keys(inMemoryDB[tableName].items[0]);
                        firstItemKeys.forEach(function(fIKey)
                        {
                            temp[fIKey] = searchObj;
                        });
                    }
                }
                return temp;
            }
            else if(typeof searchObj === "object")
            {
                // If looking for an exact match and is a complete object, only need to match unique key, nothing else, delete other keys.
                if(exactMatch && typeof searchObj[inMemoryDB[tableName].key] !== "undefined")
                {
                    Object.keys(searchObj).forEach(function(sObjKey){
                        if(inMemoryDB[tableName].key !== sObjKey)
                        {
                            delete searchObj[sObjKey];
                        }
                    });
                }
                Object.keys(searchObj).forEach(function(innerSearchKey)
                {
                    if(typeof searchObj[innerSearchKey] === "object")
                    {
                        error("Invalid search object '" + JSON.stringify(searchObj[innerSearchKey]) + "', of type '" + (typeof searchObj[innerSearchKey]) + "', expected string or object.");
                    }
                    else
                    {
                        searchObj[innerSearchKey] = searchObj[innerSearchKey]+"";
                    }
                });
            } 
            else
            {
                error("Invalid search object '" + JSON.stringify(searchObj) + "', of type '" + (typeof searchObj) + "', expected string or object.");
            }
            return searchObj;
        });
    };

    var setup = function()
    {
        loadFromFile();
        Object.keys(options.tables)
            .filter(function(tableName)
            {
                return (typeof inMemoryDB[tableName] === "undefined");
            })
            .forEach(function(tableName)
            {
                inMemoryDB[tableName] = { "items": [], "key": options.tables[tableName], "counter": 0 };
            });
    };

    var constructor = function(opts)
    {
        Object.keys(options).forEach(function(optKey)
        {
            if(opts[optKey])
            {
                options[optKey] = opts[optKey];
            }
        });
        setup();
    };

    this.set = function(tableName, itemOrItems)
    {
        // At least 2 args!! else throw
        if(arguments.length < 2)
        {
            error("Invalid arguments, you must use format db.set(<tableName>, <itemOrItems>)");
        }
        if(!tableExists(tableName))
        {
            error("Table '" + tableName + '" does not exist.');
        }
        itemOrItems = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
        var keyName = inMemoryDB[tableName].key;
        itemOrItems
            .forEach(function(newItem)
            {
                var match = inMemoryDB[tableName].items.filter(function(row){ return row[keyName] === newItem[keyName]; }).pop();
                if(match)
                {
                    Object.keys(newItem).forEach(function(newItemKey)
                    {
                        match[newItemKey] = newItem[newItemKey];
                    });
                }
                else
                {
                    if(typeof newItem[keyName] === "undefined")
                    {
                        newItem[keyName] = inMemoryDB[tableName].counter++;
                    }
                    inMemoryDB[tableName].items.push(copy(newItem));
                }
            });
        saveToFile();
    };

    this.get = function(tableName, matchObjOrAr, exactMatches)
    {
        if(arguments.length < 1)
        {
            error("Invalid arguments, you must use format db.get(<tableName>, <matchObjOrAr>, <exactMatches>)");
        }
        if(!tableExists(tableName))
        {
            error("Table '" + tableName + '" does not exist.');
        }
        // Get all in table
        if(arguments.length === 1)
        {
            return copy(inMemoryDB[tableName].items);
        }
        // Get all matching exactly
        if(!exactMatches)
        {
            matchObjOrAr = sanatizeMatchObject(tableName, matchObjOrAr, true);
            // For each item
            return copy(inMemoryDB[tableName].items.filter(function(item)
            {
                // Compare with each searchObj
                return matchObjOrAr.some(function(searchObj)
                {
                    // If all search values match item values
                    return Object.keys(searchObj).every(function(compareKey){ return (item[compareKey]+"") === searchObj[compareKey]; });
                });
            }));
        }
        // Get search matches
        matchObjOrAr = sanatizeMatchObject(tableName, matchObjOrAr, false);
        // For each item
        return copy(inMemoryDB[tableName].items.filter(function(item)
        {
            // Compare with each searchObj
            return matchObjOrAr.some(function(searchObj)
            {
                // If any search values are contained in item values
                return Object.keys(searchObj).some(function(compareKey){ return (item[compareKey]+"").indexOf(searchObj[compareKey]) !== -1; });
            });
        }));
    };

    this.del = function(tableName, matchObjOrAr)
    {
        if(arguments.length < 2)
        {
            error("Invalid arguments, you must use format db.del(<tableName>, <matchObjOrAr>)");
        }
        if(!tableExists(tableName))
        {
            error("Table '" + tableName + '" does not exist.');
        }
        matchObjOrAr = sanatizeMatchObject(tableName, matchObjOrAr, false);
        var item, matchingIndices = [];
        for(var i=0;i<inMemoryDB[tableName].items.length;i++)
        {
            var item = inMemoryDB[tableName].items[i];
            // Compare with each searchObj
            var match = matchObjOrAr.some(function(searchObj)
            {
                // If any search values are contained in item values
                return Object.keys(searchObj).some(function(compareKey){ return (item[compareKey]+"").indexOf(searchObj[compareKey]) !== -1; });
            });
            if(match)
            {
                matchingIndices.push(i);
            }
        };
        matchingIndices.reverse().forEach(function(indx)
        {
            inMemoryDB[tableName].items.splice(indx, 1);
        });
        saveToFile();
    };

    constructor.apply(this, arguments);

};