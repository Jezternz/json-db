/* Unit Tests for json-db using Mocha */

var 
    assert = require("assert"),
    fs = require("fs"),
    JsonDB = require("./index.js");

var
    dbFileNameTemplate = "test-db-{0}.json",
    populatedDBName = "test-db-populated.json",
    defaultDBName = "db.json",
    dbFileNames = ["db.json"];

var 
    fOptions = {"encoding": "utf8"};

/**/
it("Tests are prepared correctly", function()
{
    assert(fs.existsSync(populatedDBName), "Cannot complete tests! Missing pre-populated test db called '" + populatedDBName + "'");
});

describe('JsonDB', function() 
{
    var newDBName = function()
    {
        var name = dbFileNameTemplate.replace('{0}', dbFileNames.length);
        dbFileNames.push(name);
        return name;
    };

    after(function()
    {
        dbFileNames.forEach(function(dbFileName)
        {
            if(fs.existsSync(dbFileName))
            {
                fs.unlinkSync(dbFileName); 
            }
        });
    });

    /* 
        Test
        db = new JsonDB({ "fileName": <fileName>, "prettyJSON": <bool(false)>, "tables": { <setName>: <setUniqueFieldKey>, ... } });
    */

    describe('JsonDB()', function()
    {
        it("should create an accessable db in memory", function()
        {
            var db = new JsonDB();
            assert(fs.existsSync(defaultDBName), "default db filename does not exist");
        });
        it("should load setup if it is passed in", function()
        {
            var testDBName = newDBName();
            var db = new JsonDB({ "fileName": testDBName });
            assert(fs.existsSync(testDBName), "db filename does not exist");
        });
        it("should load db from a previous file", function()
        {
            var db = new JsonDB({ "fileName": populatedDBName, "prettyJSON": true });
            assert.equal(db.get("ingredients").length, 5, "Did not retrieve 5 records from '" + populatedDBName + "'");
        });
        it("should create a db file if none existed", function()
        {
            var testDBName = newDBName();
            var db = new JsonDB({ "fileName": testDBName });
            assert(fs.existsSync(testDBName), "Non-existant database was not created");
        });
        it("should create a db file that is prettyJSONed", function()
        {
            var testDBName = newDBName();
            var testDB2Name = newDBName();
            if(fs.existsSync(testDBName))fs.unlinkSync(testDBName);
            if(fs.existsSync(testDB2Name))fs.unlinkSync(testDB2Name);

            var opts = { "fileName": testDBName, "prettyJSON": false, "tables": { "randomTable": "randomId" } };

            var db = new JsonDB(opts);
            var countA = (fs.readFileSync(testDBName, fOptions).match(/\r\n|\r|\n/g) || []).length;

            opts.prettyJSON = true;
            opts.fileName = testDB2Name;

            var db2 = new JsonDB(opts);
            var countB = (fs.readFileSync(testDB2Name, fOptions).match(/\r\n|\r|\n/g) || []).length;

            // Test if they differ in number of newlines.
            assert.notEqual(countA, countB, "prettyJSON did not appear to work");
        });
        it("should create a db with tables", function()
        {
            var testDBName = newDBName();
            assert.doesNotThrow(function(){
                var db = new JsonDB({ "fileName": testDBName, "tables": { "testTable": "testId", "testTable2": "testId", "testTable3": "testId" } });
                var db2 = new JsonDB({ "fileName": testDBName });
                db2.get("testTable");
                db2.get("testTable2");
                db2.get("testTable3");
            }, "Tables were not created and retrieved");
        });
    });

    /* 
        Test
        db.set(<tableName>, <itemOrArray>, { "throwOnDuplicate" : <bool(false)> });
    */

    describe("db.set()", function()
    {
        
        it("should fail if db does not exist", function()
        {
            var db = new JsonDB({ "fileName": newDBName() });
            assert.throws(function()
            {
                db.set("nonExistantTable", { "rowId": 0 });
            }, "Addition of an item to a non existant table did not throw an exception");
        });
        it("should fail if row already exists and throwOnDuplicate is true", function()
        {
            var db = new JsonDB({ "fileName": newDBName(), "tables": { "randomTable" : "randomTableId" } });
            db.set("randomTable", { "randomTableId": 0 });
            assert.throws(function()
            {
                db.set("randomTable", { "randomTableId": 0 }, { "acceptNewItems":false });
            }, "Addition of a duplicate item did not throw an exception"); 
        });
        it("should silently fail if no item or items", function()
        {
            var db = new JsonDB({ "fileName": newDBName(), "tables": { "randomTable" : "randomTableId" } });
            db.del("randomTable");
            db.set("randomTable", true);
            db.set("randomTable", false);
            db.set("randomTable", null);
            db.set("randomTable", 1);
            db.set("randomTable", 0);
            db.set("randomTable", []);
            assert.equal(db.get("randomTable").length, 0, "Adding a non-object or an empty array, should not add items to table.");
        });
        it("should insert a single item", function()
        {            
            var db = new JsonDB({ "fileName": newDBName(), "tables": { "randomTable" : "randomTableId" } });
            assert.equal(db.get("randomTable").length, 0, "Creating an empty table, should result in 0 items");
            db.set("randomTable", { "randomTableId": 0, "randomObjectProperty": "1" });
            assert.equal(db.get("randomTable").length, 1, "Adding a single item, should result in a table with one item.");
        });
        it("should insert multiple items", function()
        {            
            var db = new JsonDB({ "fileName": newDBName(), "tables": { "randomTable" : "randomTableId" } });
            assert.equal(db.get("randomTable").length, 0, "Creating an empty table, should result in 0 items");
            var items = [{ "randomObjectProperty": "1" }, { "randomObjectProperty": "2" }, { "randomObjectProperty": "3" }, { "randomObjectProperty": "4" }, { "randomObjectProperty": "5" }];
            db.set("randomTable", items);
            assert.equal(db.get("randomTable").length, items.length, "Adding " + items.length + " items, should result in a table with " + items.length + " items.");
        });
        it("Inserting objects with properties and retrieving these, should result in the same properties coming out", function()
        {   
            var db = new JsonDB({ "fileName": newDBName(), "tables": { "randomTable" : "randomTableId" } });
            var itemsIn = [{ "property1": "1" }, { "PROPERTY2": 2 }, { "propertyBool": true }, { "propertyString": "ABC_123" }, { "propertyObject": {"A":1, "B":2, "C":{"D":4}} }];
            db.set("randomTable", itemsIn);
            var itemsOut = db.get("randomTable");
            assert.equal(itemsOut.filter(function(it){ return it.property1 === "1"; }).length, 1, 
                "Did not return a single string number stored in a property");
            assert.equal(itemsOut.filter(function(it){ return it.PROPERTY2 === 2; }).length, 1, 
                "Did not return a single number stored in a property");
            assert.equal(itemsOut.filter(function(it){ return it.propertyBool === true; }).length, 1, 
                "Did not return a single bool stored in a property");
            assert.equal(itemsOut.filter(function(it){ return it.propertyString === "ABC_123"; }).length, 1, 
                "Did not return a single string stored in a property");
            assert.equal(itemsOut.filter(function(it){ return JSON.stringify(it.propertyObject) === JSON.stringify(itemsIn[4].propertyObject); }).length, 1, 
                "Did not return a single object stored in a property");
        });
        it("should update a single item", function()
        {
            var db = new JsonDB({ "fileName": newDBName(), "tables": { "randomTable" : "randomTableId" } });
            var itemsIn = [{ "randomTableId": 0, "property1": "1" }, { "randomTableId": 1, "property1": "2" }, { "randomTableId": 2, "property1": "3" }];
            db.set("randomTable", itemsIn);
            db.set("randomTable", { "randomTableId": 1, "property1": "A" });
            var itemsOut = db.get("randomTable");
            assert.equal(itemsOut.length, 3, "Returned incorrect number of items");
            assert.equal(itemsOut.filter(function(item){ return item.property1 === "A"; }).length, 1, "Did not return updated row");
            db.set("randomTable", { "randomTableId": 1, "property2": "B" });
            var itemsOut2 = db.get("randomTable");            
            assert.equal(itemsOut2.filter(function(item){ return item.property1 === "A" && item.property2 === "B"; }).length, 1, "Did not return updated row, when 2 seperate set calls set two different properties.");
        });
        it("should update multiple items", function()
        {
            var db = new JsonDB({ "fileName": newDBName(), "tables": { "randomTable" : "randomTableId" } });
            var itemsIn = [{ "randomTableId": 0, "property1": "1" }, { "randomTableId": 1, "property1": "2" }, { "randomTableId": 2, "property1": "3" }];
            var itemsUpdate = [{ "randomTableId": 0, "property1": "5" }, { "randomTableId": 1, "property1": "6" }, { "randomTableId": 2, "property1": "7" }];
            db.set("randomTable", itemsIn);
            db.set("randomTable", itemsUpdate);
            var itemsOut = db.get("randomTable");
            assert.equal(itemsOut.length, 3, "Wrong number of items after a group update were returned.");
            assert.equal(itemsUpdate.filter(function(item){ return item.property1 === "5"; }).length, 1, "Updated value of '5' not found in multi-update set.");
            assert.equal(itemsUpdate.filter(function(item){ return item.property1 === "6"; }).length, 1, "Updated value of '6' not found in multi-update set.");
            assert.equal(itemsUpdate.filter(function(item){ return item.property1 === "7"; }).length, 1, "Updated value of '7' not found in multi-update set.");
        });
        it("should return items that have been updated or added", function()
        {
            var db = new JsonDB({ "fileName": newDBName(), "tables": { "randomTable" : "randomTableId" } });
            var rows = [{ "randomTableId": "1", "randomField": "2"}, { "randomTableId": "3", "randomField": "4"}];
            var rows2 = db.set("randomTable", rows);
            rows.sort(function(a, b){ return (JSON.stringify(a)+"") > (JSON.stringify(b)+""); });
            rows2.sort(function(a, b){ return (JSON.stringify(a)+"") > (JSON.stringify(b)+""); });
            assert.deepEqual(rows, rows2, "Did not return the correct row data, from a set() call.");
        });
    });

    /* 
        Test        
        db.del(<tableName>, <matchObjOrArray>);
    */

    describe("db.del()", function()
    {
        it("should fail if db does not exist", function()
        {
            var db = new JsonDB({ "fileName": newDBName() });
            assert.throws(function()
            {
                db.del("nonExistantTable", { "rowId": 0 });
            }, "Deletion of an item to a non existant table did not throw an exception");
        });
        it("should remove item from db", function()
        {
            var db = new JsonDB({ "fileName": newDBName(), "tables": { "randomTable" : "randomTableId" } });
            db.set("randomTable", { "randomTableId": 0 });
            db.del("randomTable", { "randomTableId": 0 });
            assert.equal(db.get("randomTable").length, 0, "Delete did not clear db using matchObject");

            db = new JsonDB({ "fileName": newDBName(), "tables": { "randomTable" : "randomTableId" } });
            db.set("randomTable", { "randomTableId": 0 });
            db.del("randomTable", 0);
            assert.equal(db.get("randomTable").length, 0, "Delete did not clear db using (numberic) index");
        });
        it("should remove items from db", function()
        {
            var db = new JsonDB({ "fileName": newDBName(), "tables": { "randomTable" : "randomTableId" } });
            db.set("randomTable", [{ "randomTableId": 0 }, { "randomTableId": 1 }, { "randomTableId": 2 }]);
            db.del("randomTable", [{ "randomTableId": 1 }, { "randomTableId": 2 }]);
            assert.equal(db.get("randomTable").length, 1, "Delete did not clear multiple items from db.");
            db = new JsonDB({ "fileName": newDBName(), "tables": { "randomTable" : "randomTableId" } });
            db.set("randomTable", [{ "randomTableId": 0 }, { "randomTableId": 1 }, { "randomTableId": 2 }]);
            db.del("randomTable", [1, 2]);
            assert.equal(db.get("randomTable").length, 1, "Delete did not clear multiple items from db using uniqueIds.");
        });
        it("should fail silently if item does not exist", function()
        {
            var db = new JsonDB({ "fileName": newDBName(), "tables": { "randomTable" : "randomTableId" } });
            db.set("randomTable", [{ "randomTableId": 0 }, { "randomTableId": 1 }, { "randomTableId": 2 }]);
            assert.doesNotThrow(function()
            {
                db.del("randomTable", [{ "randomTableId": 4 }, { "randomTableId": 5 }]);
                db.del("randomTable", [{ "randomTableId": 6 }]);
                db.del("randomTable", [{ "randomTableId": 7 }, { "randomTableId": 8 }, { "randomTableId": 9 }]);
            }, "Deletion of a non-existant item, threw when it should fail silently.");
            assert.equal(db.get("randomTable").length, 3, "Delete must have deleted an item it was not supposed to.");
        });
        it("should clear complete table if no second paramater is passed in.", function()
        {
            var db = new JsonDB({ "fileName": newDBName(), "tables": { "randomTable" : "randomTableId" } });
            db.set("randomTable", [{ "randomTableId": 0 }, { "randomTableId": 1 }, { "randomTableId": 2 }]);
            db.del("randomTable");
            assert.equal(db.get("randomTable").length, 0, "expected del(table) to clear all items in table, but some were not cleared.");
        });
        it("should return items that have been deleted", function()
        {
            var db = new JsonDB({ "fileName": newDBName(), "tables": { "randomTable" : "randomTableId" } });
            var originalArray = [{ "randomTableId": "1", "randomField": "2"}, { "randomTableId": "3", "randomField": "4"}, { "randomTableId": "5", "randomField": "6"}];
            db.set("randomTable", originalArray);
            var delItems = db.del("randomTable", ["1", "3"]);
            delItems.sort(function(a, b){ return (JSON.stringify(a)+"") > (JSON.stringify(b)+""); });
            originalArray.pop();
            originalArray.sort(function(a, b){ return (JSON.stringify(a)+"") > (JSON.stringify(b)+""); });
            assert.deepEqual(delItems, originalArray, "Did not return the correct row data, from a del() call.");
        });
    });

    /* 
        Test
        db.get(<tableName>, <matchObjOrArray>, { "exactMatch": <bool(false)>, caseSensitive": <bool(true)>, "orderBy": <fieldName(null)>, "orderAscending": <bool(false)>, "offset": <number(0)>, "limit": <number(-1)> });
    */

    describe("db.get()", function()
    {
        var populatedDB = function()
        {
            return new JsonDB({ "fileName": populatedDBName, "prettyJSON": true });
        };

        it("should fail if db does not exist", function()
        {
            var db = populatedDB();
            assert.throws(function()
            {
                db.get("nonExistantTable");
            }, "Addition of an item to a non existant table did not throw an exception");
        });
        it("should retrieve complete table when no matchObj is passed", function()
        {
            var db = populatedDB();
            var itemCount = db.get("recipes").length;
            assert.equal(itemCount, 15, "Incorrect number of items retrieved when requesting all items in table.");
        });
        it("should return item by a single index", function()
        {
            var db = populatedDB();
            assert.equal(db.get("ingredients", 1).length, 1, "Did not retrieve single item by non-string index.");
            assert.equal(db.get("recipes", "1").length, 1, "Did not retrieve single item by string index.");
        });
        it("should return items by an array of indexes", function()
        {
            assert.equal(populatedDB().get("recipes", ["1", "2", "3"]).length, 3, "Did not retrieve correct number of items using an array of non-string indexes.");
        });
        it("should return single item that matches an (exact) search", function()
        {
            var matches = populatedDB().get("recipes", { "name": "ginger pumpkin" }, { "exactMatch": true });
            assert.equal(matches.length, 1, "Did not retrieve correct number of items using an exact match test.");
        });
        it("should return items that match multiple (exact) matches", function()
        {
            var matches = populatedDB().get("recipes", [{ "name": "ginger pumpkin" }, { "name": "ginger pumpkin steak" }, { "recipeId": "10" }], { "exactMatch": true });
            assert.equal(matches.length, 3, "Did not retrieve correct number of items using an exact match test.");
        });
        it("should return single item that matches a (non-exact) search", function()
        {
            var matches = populatedDB().get("recipes", [{ "name": "Cakes" }]);
            assert.equal(matches.length, 1, "Did not retrieve correct number of items using a non-exact match test.");
        });
        it("should return items that match a (non-exact) search", function()
        {
            var matches = populatedDB().get("recipes", [{ "name": "Cakes" }]);
            assert.equal(matches.length, 1, "Did not retrieve correct number of items using a non-exact match test.");
        });
        it("should return items that match a case insensitive search", function()
        {
            var matches = populatedDB().get("recipes", [{ "name": "Fish" }, { "name": "Soup" }]);
            assert.equal(matches.length, 5, "Did not retrieve correct number of items using a non-exact (multi-term) match test.");
        });
        it("should order returned items by a column descending", function()
        {
            var matches = populatedDB().get("recipes", false, { "orderBy": "name" });
            assert.equal(matches[0].name, "zzzzz Doughnut", "Did not order first item in correct order for descending sort");
            assert.equal(matches[matches.length-1].name, "AAAAA Doughnut", "Did not order last item in correct order for descending sort");            
        });
        it("should order returned items by a column ascending", function()
        {
            var matches = populatedDB().get("recipes", false, { "orderBy": "name", "orderAscending":true });
            assert.equal(matches[matches.length-1].name, "zzzzz Doughnut", "Did not order first item in correct order for ascending sort");
            assert.equal(matches[0].name, "AAAAA Doughnut", "Did not order last item in correct order for ascending sort");   
        });
        it("should return items ordered by a column descending, starting at an offset", function()
        {
            var matches = populatedDB().get("recipes", false, { "orderBy": "name", "offset":5 });
            assert.equal(matches.length, 10, "Did not return correct number of items, when an offset has been set");
            assert.equal(matches[0].name, "Ginger Pumpkin Soup", "Did not return correct number of items, when an offset has been set");

        });
        it("should return items ordered by a column ascending, starting at an offset", function()
        {

        });
        it("should return items ordered by a column descending, limited to a number", function()
        {

        });
        it("should function correctly with combined search options. Including a search, caseInsensitive, orderBy, orderAscending, limit", function()
        {

        });
        it("should match no items, when there are no matches", function()
        {
            // Do a simple one
            // followed by a complex one.
        });
    });

});
/**/