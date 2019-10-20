var express = require("express");
var exphbs = require("express-handlebars");
var logger = require("morgan");
var mongoose = require("mongoose");
var path = require("path");

var db = mongoose.connection;

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// handlebars
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Make public a static folder
app.use(express.static("public"));

// clear collections
db.on("error", console.error);
db.once("open", function() {
  console.log("db connect");  
  db.dropCollection("articles", function(err, result) {
    // 26 means collection does not exits
    if (err) {
      if (err.code === 26) {
        return
      }
      console.log("error delete articles", err);
    } else if (result) {
      console.log("delete articles success", result);
    }
  });

  db.dropCollection("notes", function(err, result) {
    // 26 means collection does not exits
    if (err) {
      if (err.code === 26) {
        return
      }
      console.log("error delete note");
    } else if (result) {
      console.log("delete note success");
    }
  });
});

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/newsiesScraper";
// Connect to the Mongo DB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
/*
mongoose.connect("mongodb://localhost/newsiesScraper", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
*/

// Routes
require("./routes/apiRoutes")(app);
require("./routes/htmlRoutes")(app);

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
