import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:3001/admin/products")
      .then((response) => response.json())
      .then((products) => {
        setProductsLoading(false);
        setProducts(products);
      })
      .catch((error) => {
        setProductsLoading(false);
        setProductsError(JSON.stringify(error));
      });
  }, []);

  return (
    <div>
      <h2>Produits</h2>
      {productsError}
      {productsLoading && "Chargement"}
      <ul>
        {products.map((product) => (
          <li key={product._id}>
            <Link to={"/products/" + product._id}>{product.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
export default Products;
