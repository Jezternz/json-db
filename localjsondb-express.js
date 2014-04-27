/*
    
    LocalJsonDB (Local JSON storage)

    https://github.com/Jezternz/localjsondb
    by Joshua McLauchlan 2014

*/

var responseMessage = function(str)
{
    return '{ "message": "' + (typeof str === "string" ? str : JSON.stringify(str)) + '" }';
};

var actions = {

    "get": function(args)
    {
        if(args.itemId !== false)
        {
            if(args.itemExists)
            {
                var getResult = this.get(args.tableName, args.itemId, { "exactMatch": true });
                args.sendResponse(200, JSON.stringify(getResult[0]));
            }
            else
            {
                args.sendResponse(204, responseMessage("Could not find object to retrieve, where unique key '" + args.tableKey + "' === '" + args.itemId + "'."));
            }
        }
        else
        {
            var getResults = this.get(args.tableName, args.searches, args.searchOptions);
            args.sendResponse(200, JSON.stringify(getResults));
        }
    },

    "post": function(args)
    {
        if(args.itemId)
        {
            if(args.itemExists)
            {
                if(typeof args.body === "object")
                {
                    args.body[args.tableKey] = args.itemId;
                    var out = this.set(args.tableName, args.body);
                    args.sendResponse(200, JSON.stringify(out)); 
                }
                else
                {
                    args.sendResponse(409, responseMessage("Could not add object, as the item was not an object '" + JSON.stringify(args.body) + "'."));
                }
            }
            else
            {
                args.sendResponse(409, responseMessage("Could not add object, as an item already exists where the unique key '" + args.tableKey + "' === '" + obj[args.tableKey] + "'."));
            }
        }
        else
        {
            var out = this.set(args.tableName, args.body);
            args.sendResponse(200, JSON.stringify(out)); 
        }
    },

    "put": function(args)
    {
        if(args.itemId)
        {
            args.body[args.tableKey] = args.itemId;
        }
        var out = this.set(args.tableName, args.body);
        args.sendResponse(200, JSON.stringify(out));
    },

    "delete":function(args)
    { 
        if(typeof args.itemId === "undefined")
        {
            args.sendResponse(204, responseMessage("No unique key specified for deletion."));
        }
        else if(args.itemId)
        {
            var out = this.del(args.tableName, args.itemId);
            args.sendResponse(200, JSON.stringify(out));
        }
        else if(req.body)
        {
            var out = this.del(args.tableName, req.body);
            args.sendResponse(200, JSON.stringify(out));
        }
        else
        {
            args.sendResponse(409, responseMessage("Could not delete object, as there was no body or item id included in call."));
        }
    },

    "unrecognized": function(args)
    {
        args.sendResponse(405, "Unrecognized request method.");
    }

};

var parseExpressInput = function(req, res)
{
    var parts = req.params[0].split("/");    
    var actionArgs = {
        "method": req.method.toLowerCase(),
        "tableName": parts[0] || false,
        "itemId": parts[1] || false,
        "sendResponse": res.send.bind(res)
    };

    if(["get", "delete"].indexOf(actionArgs.method) === -1)
    {
        if(typeof req.body === "object" && Object.keys(req.body).length > 0)
        {
            actionArgs.body = JSON.parse(JSON.stringify(req.body));
        }
        else if(typeof req.body === "string")
        {
            try
            {
                actionArgs.body = JSON.parse(req.body);
            }
            catch(er)
            {
                console.error("Failed to parse express req.body to JSON, value='", req.body, "' parse error='", er, "'.");
                res.send(500);
                return false;
            }
        }
        else
        {
            console.error("request.body missing from express all() handler. It is likely you do not have a bodyParser() installed. To remedy this, 'npm install body-parser', then in your code include 'app.use(bodyParser.json())' before 'app.all()'.");
            res.send(500);
            return false;
        }  
    }

    if(!actionArgs.tableName || !this._tableExists(actionArgs.tableName))
    {
        res.send(404, '{ "message": "Could not find table with name \'' + actionArgs.tableName + '\'." }');
        return false;
    }

    actionArgs.tableKey = this._getTableKey(actionArgs.tableName);

    if(typeof itemId !== false)
    {
        actionArgs.itemExists = this.get(actionArgs.tableName, actionArgs.itemId, { "exactMatch": true }).length > 0;
    }

    if(typeof req.query === "object" && Object.keys(req.query).length > 0)
    {
        // Calculate searches
        var rawQuery = JSON.parse(JSON.stringify(req.query));
        if(typeof rawQuery.searchCount !== "undefined")
        {
            actionArgs.searches = [];
            for(var i=0;i<rawQuery.searchCount;i++)
            {
                if(typeof rawQuery["search"+i] !== "undefined")
                {
                    var search = decodeURIComponent(rawQuery["search"+i]).split(":");
                    var obj = {};
                    obj[search[0]] = search[1]; 
                    actionArgs.searches.push(obj);
                }
            }
        }
        // calculate search options
        actionArgs.searchOptions = {};
        ["offset", "limit"].forEach(function(optName)
        {
            if(typeof rawQuery[optName] !== "undefined" && !isNaN(rawQuery[optName]))
            {
                actionArgs.searchOptions[optName] = parseInt(rawQuery[optName]);
            }
            delete rawQuery[optName];
        });
        ["exactMatch", "ignoreCase", "orderAscending"].forEach(function(optName)
        {
            if(typeof rawQuery[optName] !== "undefined" && (rawQuery[optName] === "true" || rawQuery[optName] === "false"))
            {
                actionArgs.searchOptions[optName] = (rawQuery[optName] === "true");
            }
            delete rawQuery[optName];
        });
        for(var optName in rawQuery)
        {
            actionArgs.searchOptions[optName] = rawQuery[optName]+"";
        }
    }

    return actionArgs;
};

module.exports = function(jsonDB)
{
    return function(req, res, next)
    {
        try
        {
            var actionArgs = parseExpressInput.call(jsonDB, req, res);
            if(actionArgs !== false)
            {
                actions[actionArgs.method].call(jsonDB, actionArgs); 
            }
        }
        catch(er)
        {
            console.error(er);
            args.sendResponse(500, responseMessage("Something went wrong with your request, please see server logs for more details.")); 
        }
    };
};