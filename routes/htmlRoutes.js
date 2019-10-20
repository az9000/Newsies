// Require all models
var db = require("../models");
// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

module.exports = function(app) {
  app.get("/", function(req, res) {
    db.Article.find({}, function(error, dbArticles) {
      // Log any errors
      if (error) {
        console.log(error);
      } else {
        if (dbArticles) {
          res.render("index", {
            articles: dbArticles,
            loadingText: ""
          });
        } else {
          res.render("index", {});
        }
      }
    });
  });

  async function getArticles(cb) {
    console.log("1:", new Date());
    const response = await axios.get("https://news.google.com/");
    const items = response.data;
    let $ = await cheerio.load(items);
    let articles = [];
    $("div > div > article").each((index, element) => {
      if (
        $(element)
          .children("h3")
          .text().length > 0
      ) {
        var article = {};
        article.title = $(element)
          .children("h3")
          .text();
        article.link =
          "https://news.google.com" +
          $(element)
            .children("a")
            .attr("href")
            .substring(1);
        if (
          !$(element)
            .prev()
            .children("figure")
            .children("img")
            .attr("src")
        ) {
          article.img = $(element)
            .parent()
            .prev()
            .children("figure")
            .children("img")
            .attr("src");
        } else {
          article.img = $(element)
            .prev()
            .children("figure")
            .children("img")
            .attr("src");
        }
        if (!article.img) {
          article.img = "";
        }
        article.summary = $(element)
          .children("div")
          .children("span")
          .text();
        article.read = false;

        articles.push(article);
      }
    });
    console.log("3:", articles.length);
    cb(articles);
  }

  // A GET route for scraping the echoJS website
  app.get("/scrape", function(req, res) {
    getArticles(articles => {
      db.Article.create(articles, function(err, dbArticles) {
        if (err) throw err;
        res.render("index", {
          articles: dbArticles,
          loadingText: "",
          lastUpdate: new Date().toLocaleString()
        });
      });
    });
  });

  // Route for getting all read Articles from the db
  app.get("/saved", function(req, res) {
    // TODO: Finish the route so it grabs all of the articles
    db.Article.find({ read: true })
      .then(function(dbArticles) {
        // If any Books are found, send them to the client
        res.render("saved", { articles: dbArticles });
      })
      .catch(function(err) {
        // If an error occurs, send it back to the client
        res.json(err);
      });
  });

  app.get("/remove/:id", function(req, res) {
    db.Article.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { read: false } },
      { new: true },
      (err, dbArticle) => {
        if (err) {
          console.log("Something wrong when updating data!");
        }

        res.redirect("/saved");
      }
    );
  });

  app.get("/clear", function(req, res) {
    res.render("index", { articles: [] });
  });

  // Route for grabbing a specific Article by id, populate it with it's note
  app.get("/articles/:id", function(req, res) {
    // TODO
    // ====
    // Finish the route so it finds one article using the req.params.id,
    // and run the populate method with 'note',
    // then responds with the article with the note included
    db.Article.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { read: true } },
      { new: true },
      (err, dbArticle) => {
        if (err) {
          console.log("Something wrong when updating data!");
        }

        res.redirect("/saved");
      }
    );
  });

  // get notes for an article
  app.get("/notes/:id", function(req, res) {
    db.Article.findById(req.params.id, function(err, dbArticle) {
      if (dbArticle.notes) {
        res.json({
          id: req.params.id,
          title: dbArticle.title,
          notes: dbArticle.notes
        });
      } else {
        res.json({ id: req.params.id, title: dbArticle.title });
      }
    });
  });

  // save note
  app.post("/notes/:id", function(req, res) {
    console.log("saving note for article id:", req.params.id);
    console.log("saving note:", req.body.body);
    // Create a new Note in the database
    db.Note.create(req.body)
      .then(function(dbNote) {
        console.log(dbNote);
        return db.Article.findOneAndUpdate(
          {
            _id: req.params.id
          },
          { $push: { notes: dbNote.body } },
          { new: true }
        );
      })
      .then(function(dbArticle) {
        // If the Article was updated successfully, send it back to the client
        res.json(dbArticle);
      })
      .catch(function(err) {
        // If an error occurs, send it back to the client
        res.json(err);
      });
  });

  // delete note
  app.delete("/notes/:id", function(req, res) {
    const id = req.params.id;
    const article_id = req.body.article_id;
    db.Article.findById(article_id, function(err, dbArticle) {
      if (err) throw err;

      let _notes = dbArticle.notes.filter((note, index) => {
        return index !== parseInt(id);
      });
      console.log(_notes.length + " vs " + dbArticle.notes.length);
      let title = dbArticle.title;
      let link = dbArticle.link;
      let img = dbArticle.img;
      let summary = dbArticle.summary;
      let read = dbArticle.read;
      db.Article.update(
        {
          _id: article_id
        },
        {
          // Set the title, note and modified parameters
          // sent in the req body.
          $set: {
            title,
            link,
            img,
            summary,
            read,
            notes: _notes
          }
        },
        function(error, dbArticle) {
          // Log any errors from mongojs
          if (error) {
            console.log(error);
            res.send(error);
          } else {
            // Otherwise, send the mongojs response to the browser
            // This will fire off the success function of the ajax request
            console.log(dbArticle);
            res.send(dbArticle);
          }
        }
      );
    });
  });
};
