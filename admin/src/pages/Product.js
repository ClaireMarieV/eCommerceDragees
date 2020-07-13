import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const Product = () => {
  const [product, setProduct] = useState({
    name: "",
    price: "",
    description: "",
  });
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState(null);
  const { productId } = useParams();

  useEffect(() => {
    if (productId) {
      setProductLoading(true);
      fetch("http://127.0.0.1:3001/admin/products/" + productId)
        .then((response) => response.json())
        .then((product) => {
          setProductLoading(false);
          setProduct(product);
        })
        .catch((error) => {
          setProductLoading(false);
          setProductError(JSON.stringify(error));
        });
    }
  }, []);
  const saveProduct = () =>
    fetch("http://127.0.0.1:3001/admin/products/" + (productId || ""), {
      method: productId ? "put" : "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });

  return (
    <div>
      <ul>
        <h2>Produit</h2>
        {productError}
        {productLoading && "Chargement"}
        <li>
          <span>Nom</span>
          <input
            type="text"
            value={product.name}
            onChange={(event) =>
              setProduct({ ...product, name: event.target.value })
            }
          />
        </li>
        <li>
          <span>Description</span>
          <input
            type="text"
            value={product.description}
            onChange={(event) =>
              setProduct({ ...product, description: event.target.value })
            }
          />
        </li>
        <li>
          <span>Prix</span>
          <input
            type="number"
            value={product.price}
            onChange={(event) =>
              setProduct({ ...product, price: event.target.value })
            }
          />
        </li>
      </ul>
      <button onClick={() => saveProduct()}>Sauvegarder</button>
    </div>
  );
};
export default Product;
