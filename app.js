const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;
const cors = require("cors");
const express = require("express");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");

const app = express();

app.set("view engine", "pug");
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(cors());
app.use(cookieParser());

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

    app.get("/login", function (req, res) {
      res.render("login", {
        title: "Connexion",
      });
    });

    app.post("/login", function (req, res) {
      const email = req.body.email;
      const password = req.body.password;

      db.collection("user")
        .find({
          email: email,
        })
        .toArray(function (err, docs) {
          if (docs.length > 0) {
            const user = docs[0];
            argon2
              .verify(user.password, password)
              .then((ok) =>
                ok ? Promise.resolve(user) : Promise.reject("password is wrong")
              )
              .then(() => {
                res.set(
                  "Set-Cookie",
                  "jwt=" +
                    jwt.sign(
                      {
                        _id: user._id,
                        email: user.email,
                      },
                      process.env.JWT_SECRET,
                      { expiresIn: process.env.JWT_EXPIRATION }
                    )
                );
                res.redirect("/");
              });
          }
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

    app.post("/produit/:id", function (req, res) {
      const collection = db.collection("product");
      collection
        .find({ _id: ObjectID(req.params.id) })
        .toArray(function (err, docs) {
          if (err) {
            console.error(err);
          } else {
            const { jwt: token } = req.cookies;

            if (!token || !jwt.verify(token, process.env.JWT_SECRET)) {
              res.render("product", {
                product: docs[0],
                title: "Produit",
              });
            } else {
              const { _id } = jwt.decode(token, process.env.JWT_SECRET);
              db.collection("order")
                .find({ user: _id, status: "pending" })
                .toArray(function (err, orders) {
                  if (err) {
                    console.error(err);
                  } else {
                    const order = orders[0];
                    if (!order) {
                      db.collection("order").insert(
                        {
                          user: _id,
                          status: "pending",
                          products: [req.params.id],
                        },
                        {},
                        function (err, orders) {
                          if (err) {
                            console.error(err);
                          } else {
                            res.render("product", {
                              product: docs[0],
                              title: "Produit",
                            });
                          }
                        }
                      );
                    } else {
                      db.collection("order").update(
                        { _id: ObjectID(order._id) },
                        {
                          ...order,
                          products: order.products.concat(req.params.id),
                        },
                        {},
                        function (err, orders) {
                          if (err) {
                            console.error(err);
                          } else {
                            res.render("product", {
                              product: docs[0],
                              title: "Produit",
                            });
                          }
                        }
                      );
                    }
                  }
                });
            }
          }
        });
    });

    app.get("/panier", function (req, res) {
      const { jwt: token } = req.cookies;

      if (!token || !jwt.verify(token, process.env.JWT_SECRET)) {
        res.render("product", {
          product: docs[0],
          title: "Produit",
        });
      } else {
        const { _id } = jwt.decode(token, process.env.JWT_SECRET);
        db.collection("order")
          .find({ user: _id, status: "pending" })
          .toArray(function (err, orders) {
            if (err) {
              console.error(err);
            } else {
              const order = orders[0];
              db.collection("product")
                .find({
                  $or: order.products.map((id) => ({ _id: ObjectID(id) })),
                })
                .toArray(function (err, products) {
                  if (err) {
                    console.error(err);
                  } else {
                    res.render("cart", {
                      products: products,
                      title: "Panier",
                    });
                  }
                });
            }
          });
      }
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
      const description = req.body.description;
      const price = req.body.price;
      db.collection("product").insert({
        name: name,
        description: description,
        price: price,
      });
    });
    app.put("/admin/products/:id", function (req, res) {
      const name = req.body.name;
      const description = req.body.description;
      const price = req.body.price;
      db.collection("product").update(
        { _id: ObjectID(req.params.id) },
        {
          name: name,
          description: description,
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
