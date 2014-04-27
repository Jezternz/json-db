/*
    
    LocalJsonDB (Local JSON storage)

    https://github.com/Jezternz/localjsondb
    by Joshua McLauchlan 2014

*/

/* Note to run this example, you will likely need to install express nodejs modules for this example, this can be done locally by running commad 'npm install express body-parser' in the localjsondb directory. */

// Create our express web server
var 
    path = require("path"),
    LocalJsonDB = require("../localjsondb.js"),
    express = require('express'),
    bodyParser = require('body-parser'),
    app = express();

var
    port = 8080;

var db = new LocalJsonDB({
    // Name of file db, defaults to "db.json"
    "fileName": path.join(__dirname, "example-express-db.json"),  
    // Whether to store the JSON in human readable form, defaults to false
    "prettyJSON": true,  
    // An object containing key:value where tableName:tableUniqueKeyName
    "tables": 
    {
        "users":"userId",
        "recipes":"recipeId"
    }
});

// Need this or things will go boom
app.use(bodyParser.json());

// Attach localjsondb REST handler to express.
app.get('/', function(req, res, next){ res.sendfile(path.join(__dirname, "example-express-db-client.htm")); });
app.all('/api/*', db.expressRoute);

// Start web server
app.listen(port);

console.log(
    "----- LocalJsonDB Express Rest service example running -----\n" + 
    "rest api -> http://localhost:" + port + "/api/[tableName]/\n" +
    "client   -> http://localhost:" + port + "/\n"
);