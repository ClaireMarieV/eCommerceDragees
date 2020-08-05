const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const database = require("./server/database");
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
app.use(express.static("public"));

database()
  .then(({ database, db }) => {
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
      const firstname = req.body.firstname;
      const lastname = req.body.lastname;

      argon2
        .hash(password, { type: argon2.argon2id })
        .then((password) => {
          db.collection("user").insert({
            firstname: firstname,
            lastname: lastname,
            email: email,
            password: password,
          });
        })
        .then((user) => {
          res.redirect("/profil");
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
                res.redirect("/profil");
              });
          }
        });
    });

    app.get("/profil", function (req, res) {
      const { jwt: token } = req.cookies;

      if (!token || !jwt.verify(token, process.env.JWT_SECRET)) {
        res.redirect("/login");
      } else {
        const { _id } = jwt.decode(token, process.env.JWT_SECRET);

        db.collection("order")
          .find({
            user: ObjectID(_id),
            status: "completed",
          })
          .toArray(function (err, orders) {
            if (err) {
              console.error(err);
            } else {
              res.render("profil", {
                orders,
                title: "Page de profil",
              });
            }
          });
      }
    });

    app.post("/profil", function (req, res) {
      const { jwt: token } = req.cookies;
      const address = req.body.address;

      if (!token || !jwt.verify(token, process.env.JWT_SECRET)) {
        res.redirect("/login");
      } else {
        // si token validé => id recupéré
        const { _id } = jwt.decode(token, process.env.JWT_SECRET);

        database
          .getUser(_id)
          .then((user) => {
            // premier user de la liste recupéré
            db.collection("user").update(
              { _id: ObjectID(user._id) },
              {
                ...user,
                address: address,
              },
              {},
              function (err, users) {
                if (err) {
                  console.error(err);
                } else {
                  res.render("profil", {
                    title: "Page de profil",
                  });
                }
              }
            );
          })
          .catch((error) => console.error(error));
      }
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
      database
        .getProduct(req.params.id)
        .then((product) => {
          res.render("product", { product: product, title: "Produit" });
        })
        .catch((error) => console.error(error));
    });

    app.post("/produit/:id", function (req, res) {
      const collection = db.collection("product");
      collection
        .find({ _id: ObjectID(req.params.id) })
        .toArray(function (err, products) {
          if (err) {
            console.error(err);
          } else {
            const { jwt: token } = req.cookies;

            if (!token || !jwt.verify(token, process.env.JWT_SECRET)) {
              res.render("product", {
                product: products[0],
                title: "Produit",
              });
            } else {
              //deconstruction de l'objet du jwt
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
                              product: products[0],
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
                              product: products[0],
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

    // recupere info et affiche, pas de maj !
    app.get("/panier", function (req, res) {
      const { jwt: token } = req.cookies;
      const qty = db.collection("quantity");

      //si pas de token ou si jwt pas valide
      if (!token || !jwt.verify(token, process.env.JWT_SECRET)) {
        res.redirect("/login");
      } else {
        // si token validé id recupéré
        const { _id } = jwt.decode(token, process.env.JWT_SECRET);

        database
          .getCart(_id)
          .then((order) => {
            res.render("cart", {
              products: order.products,
              title: "Panier",
            });
          })
          .catch((error) => console.error(error));
      }
    });

    app.get("/livraison", function (req, res) {
      const { jwt: token } = req.cookies;

      if (!token || !jwt.verify(token, process.env.JWT_SECRET)) {
        res.render("login", {});
      } else {
        //récupère order avec statut pending
        const { _id } = jwt.decode(token, process.env.JWT_SECRET);

        database
          .getUser(_id)
          .then((user) => {
            // premier user de la liste recupéré
            res.render("delivery", {
              address: user.address,
              title: "Adresse de livraison",
            });
          })
          .catch((error) => console.error(error));
      }
    });

    app.post("/livraison", function (req, res) {
      const collection = db.collection("order");
      const user = db.collection("user");
      const { jwt: token } = req.cookies;

      if (!token || !jwt.verify(token, process.env.JWT_SECRET)) {
        res.render("login", {});
      } else {
        //récupère order avec statut pending
        const { _id } = jwt.decode(token, process.env.JWT_SECRET);

        collection
          .find({ user: _id, status: "pending" })
          .toArray(function (err, orders) {
            if (err) {
              console.error(err);
            } else {
              const order = orders[0];

              db.collection("order").update(
                { _id: ObjectID(order._id) },
                {
                  ...order,
                  address: address,
                },
                {},
                function (err, orders) {
                  if (err) {
                    console.error(err);
                  } else {
                    res.redirect("/");
                  }
                }
              );
            }
          });
      }
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
  })
  .catch((error) => console.error(error));
