var 
    assert = require("assert"),
    jsondb = require("./index.js");

describe('json-db.DB', function() 
{
    beforeEach(function()
    {
        this.db = new jsondb.DB({
            "fileName": "test-db.json",  
            "prettyJSON": false,
            "tables": 
            {
                "test-table-1":"test-id-1",
                "test-table-2":"test-id-2"
            }
        });
    });


    describe('.put()', function() 
    {

    });

    describe('.del()', function() 
    {

    });

    describe('.get()', function() 
    {

    });

});