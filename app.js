const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;
const express = require("express");
const app = express();

// Create a new MongoClient
const client = new MongoClient("mongodb://localhost:27017", {
  useUnifiedTopology: true,
});

// Use connect method to connect to the Server
client.connect(function (err) {
  if (err) {
    console.error(err);
  } else {
    console.log("Connected successfully to server");
    const db = client.db("dragees");

    app.get("/", function (req, res) {
      res.send("Hello World!");
    });

    app.get("/admin/products", function (req, res) {
      const collection = db.collection("product");
      // Find some documents
      collection.find({}).toArray(function (err, docs) {
        if (err) {
          console.error(err);
        } else {
          res.send(JSON.stringify(docs));
        }
      });
    });

    app.get("/admin/products/:id", function (req, res) {
      const collection = db.collection("product");
      // Find some documents
      collection
        .find({ _id: ObjectID(req.params.id) })
        .toArray(function (err, docs) {
          if (err) {
            console.error(err);
          } else {
            res.send(JSON.stringify(docs));
          }
        });
    });

    app.get("/admin/orders", function (req, res) {
      const collection = db.collection("order");
      // Find some documents
      collection.find({}).toArray(function (err, docs) {
        if (err) {
          console.error(err);
        } else {
          res.send(JSON.stringify(docs));
        }
      });
    });
    app.get("/admin/orders/:id", function (req, res) {
      const collection = db.collection("order");
      // Find some documents
      collection
        .find({ _id: ObjectID(req.params.id) })
        .toArray(function (err, docs) {
          if (err) {
            console.error(err);
          } else {
            res.send(JSON.stringify(docs));
          }
        });
    });

    app.get("/admin/users", function (req, res) {
      const collection = db.collection("user");
      // Find some documents
      collection.find({}).toArray(function (err, docs) {
        if (err) {
          console.error(err);
        } else {
          res.send(JSON.stringify(docs));
        }
      });
    });

    app.get("/admin/users/:id", function (req, res) {
      const collection = db.collection("user");
      // Find some documents
      collection
        .find({ _id: ObjectID(req.params.id) })
        .toArray(function (err, docs) {
          if (err) {
            console.error(err);
          } else {
            res.send(JSON.stringify(docs));
          }
        });
    });

    app.listen(3000, function () {
      console.log("Example app listening on port 3000!");
    });
  }
});
