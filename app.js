const argon2 = require("argon2");
//@TODO gerer authentification
const jwt = require("jsonwebtoken");

const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;
const cors = require("cors");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.set("view engine", "pug");
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(cors());

const client = new MongoClient("mongodb://localhost:27017", {
  useUnifiedTopology: true,
});

client.connect(function (err) {
  if (err) {
    console.error(err);
  } else {
    console.log("Connected successfully to server");
    const db = client.db("dragees");

    app.get("/", function (req, res) {
      res.send("Hello World!");
    });

    app.get("/register", function (req, res) {
      res.render("register", {
        title: "Création de compte",
      });
    });
    app.post("/register", function (req, res) {
      const email = req.body.email;
      const password = req.body.password;

      argon2
        .hash(password, { type: argon2.argon2id })
        .then((password) => {
          db.collection("user").insert({
            email: email,
            password: password,
          });
        })
        .then((user) => {
          res.redirect("/");
        });
    });
    app.get("/formulaire", function (req, res) {
      res.render("form", {
        title: "Contactez-moi",
      });
    });
    app.get("/produits", function (req, res) {
      const collection = db.collection("product");
      collection.find({}).toArray(function (err, docs) {
        if (err) {
          console.error(err);
        } else {
          res.render("products", { products: docs, title: "Dragées" });
        }
      });
    });
    app.get("/produit/:id", function (req, res) {
      const collection = db.collection("product");
      collection
        .find({ _id: ObjectID(req.params.id) })
        .toArray(function (err, docs) {
          if (err) {
            console.error(err);
          } else {
            res.render("product", { product: docs[0], title: "Produit" });
          }
        });
    });

    app.get("/historique", function (req, res) {
      res.render("history", {
        title: "De la boutique à l'évenementiel",
      });
    });

    app.get("/admin/products", function (req, res) {
      const collection = db.collection("product");
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
      collection
        .find({ _id: ObjectID(req.params.id) })
        .toArray(function (err, docs) {
          if (err) {
            console.error(err);
          } else {
            res.send(JSON.stringify(docs[0]));
          }
        });
    });
    app.post("/admin/products", function (req, res) {
      const name = req.body.name;
      const price = req.body.price;
      db.collection("product").insert({
        name: name,
        price: price,
      });
    });
    app.put("/admin/products/:id", function (req, res) {
      const name = req.body.name;
      const price = req.body.price;
      db.collection("product").update(
        { _id: ObjectID(req.params.id) },
        {
          name: name,
          price: price,
        }
      );
    });

    app.get("/admin/orders", function (req, res) {
      const collection = db.collection("order");
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

    app.listen(3001, function () {});
  }
});
