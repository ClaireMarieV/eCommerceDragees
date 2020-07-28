const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;

module.exports = () =>
  new Promise((resolve, reject) => {
    const client = new MongoClient("mongodb://localhost:27017", {
      useUnifiedTopology: true,
    });

    client.connect(function (err) {
      if (err) {
        reject(err);
      } else {
        console.log("Connected successfully to server");
        const db = client.db("dragees");
        resolve({
          database: {
            getUser: (userId) =>
              new Promise((resolve, reject) => {
                db.collection("user")
                  .find({ _id: ObjectID(userId) })
                  .toArray((error, users) => {
                    if (error) {
                      reject(error);
                    } else if (users.length == 0) {
                      reject("user not found");
                    } else {
                      resolve(users[0]);
                    }
                  });
              }),
            getCart: (userId) =>
              new Promise((resolve, reject) => {
                db.collection("orders")
                  .find({ user: userId, status: "pending" })
                  .toArray((error, orders) => {
                    if (error) {
                      reject(error);
                    } else if (orders.length == 0) {
                      reject("cart not found");
                    } else {
                      const order = orders[0];
                      db.collection("product")
                        .find({
                          //recuperation de l'id du produit
                          $or: order.products.map((id) => ({
                            _id: ObjectID(id),
                          })),
                        })
                        .toArray(function (error, products) {
                          if (error) {
                            reject(error);
                          } else {
                            const productsCount = {};

                            for (let i = 0; i < order.products.length; i++) {
                              const productId = order.products[i];

                              if (!productsCount[productId]) {
                                productsCount[productId] = 1;
                              } else {
                                productsCount[productId] =
                                  productsCount[productId] + 1;
                              }
                            }
                            resolve({
                              ...order,
                              products: products.map((product) => ({
                                ...product,
                                quantity: productsCount[product._id],
                              })),
                            });
                          }
                        });
                    }
                  });
              }),
          },
          db,
        });
      }
    });
  });
