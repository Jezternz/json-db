var jsonDB = require("./index.js");

// Setup
var db = new jsonDB.DB({
    // Name of file db, defaults to "db.json"
    "fileName": "super-db.json",  
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
    { "recipeId": "0", "name": "Shaking Beef" },
    { "recipeId": "1", "name": "Spam Sushi" },
    { "recipeId": "2", "name": "Spiny Lobster In Crazy Water" },
    { "recipeId": "3", "name": "Wacky Chocolate Cake" }
];
db.put("recipes", recipeList);

// Update recipe name where id is '1'
db.put("recipes", [
    { "recipeId": "1", "name": "Festive Nuts Cake" }
]);

// Delete "Shaking Beef" row 0 in original put
db.del("recipes", recipeList[0]);

// Get Rows that have an exact name of "Wacky Chocolate Cake"
var rowMatches = db.get("recipes", { "name": "Wacky Chocolate Cake" });
console.log("Rows with exact name 'Wacky Chocolate Cake':\n", JSON.stringify(rowMatches, null, 4), "\n");

// Get all Rows that contain the word Cake in their name
rowMatches = db.get("recipes", { "name": "Cake" }, true);
console.log("Rows with 'cake' in their name:\n", JSON.stringify(rowMatches, null, 4), "\n");

// Get all Rows with id === 1
rowMatches = db.get("recipes", "1");
console.log("Rows with '1' as id:\n", JSON.stringify(rowMatches, null, 4), "\n");

// Can also use a list of matching criteria, and combine id with other custom property names
db.del("recipes", ["1", {"name":"Wacky Chocolate Cake"}]);

// Get all rows
rowMatches = db.get("recipes");
console.log("All Rows:\n", JSON.stringify(rowMatches, null, 4), "\n");