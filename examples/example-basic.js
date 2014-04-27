/*
    
    JsonDB (Local JSON storage)

    https://github.com/Jezternz/json-db
    by Joshua McLauchlan 2014

*/

var JsonDB = require("../jsondb.js");

// Setup
var db = new JsonDB({
    // Name of file db, defaults to "db.json"
    "fileName": "example-basic-db.json",  
    // Whether to store the JSON in human readable form, defaults to false
    "prettyJSON": true,  
    // An object containing key:value where tableName:tableUniqueKeyName
    "tables": 
    {
        "recipes":"recipeId",
        "ingredients":"ingredientId"
    }  
});

// Add recipes
var recipeList = [
    { "recipeId": "0", "name": "Ginger Shaking Beef" },
    { "recipeId": "1", "name": "ginger spam sushi" },
    { "recipeId": "2", "name": "Ginger Spiny Lobster In Crazy Water" },
    { "recipeId": "3", "name": "Ginger Wacky Chocolate Cake" }
];
db.set("recipes", recipeList);

// Update recipe name where id is '1'
db.set("recipes", [
    { "recipeId": "1", "name": "ginger festive nuts cake" }
]);

// Delete "Shaking Beef" row 0 in original put
db.del("recipes", recipeList[0]);

// Get Rows that have an exact name of "Wacky Chocolate Cake"
var rowMatches = db.get("recipes", { "name": "Ginger Wacky Chocolate Cake" }, { "exactMatch": true });
console.log("Rows with exact name 'Wacky Chocolate Cake':\n", JSON.stringify(rowMatches, null, 4), "\n");

// Get all Rows that contain the word Cake in their name
rowMatches = db.get("recipes", { "name": "Cake" });
console.log("Rows with 'cake' in their name:\n", JSON.stringify(rowMatches, null, 4), "\n");

// Get all Rows with recipeId === 1
rowMatches = db.get("recipes", "1");
console.log("Rows with '1' as id:\n", JSON.stringify(rowMatches, null, 4), "\n");

// Get all rows with a more complex search with pagination
rowMatches = db.get("recipes", { "name": "ginger" }, { "ignoreCase": true, "orderBy": "name", "orderAscending": true, "offset": 1, "limit": 2 });
console.log("Rows with a name case insensitive match for 'ginger', ordered by name ascending, with an offset of 1 and a limit of 2.\n", JSON.stringify(rowMatches, null, 4), "\n");

// Can also use a list of matching criteria, can either be a list of unique row id's or search objects as previously used.
db.del("recipes", ["1", "3"]);
console.log("Removing rows with id 1 and 3:\n");

// Get all rows
rowMatches = db.get("recipes");
console.log("All Rows:\n", JSON.stringify(rowMatches, null, 4), "\n");

