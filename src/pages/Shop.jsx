// filepath: /f1-store/f1-store/src/pages/Shop.jsx
import React from 'react';
import ProductCard from '../components/ProductCard';

const products = [
  {
    id: 1,
    title: 'Formula 1 Racing Car',
    price: 299.99,
    image: 'path/to/image1.jpg', // Replace with actual image path
  },
  {
    id: 2,
    title: 'F1 Team Cap',
    price: 49.99,
    image: 'path/to/image2.jpg', // Replace with actual image path
  },
  {
    id: 3,
    title: 'F1 Racing Jacket',
    price: 199.99,
    image: 'path/to/image3.jpg', // Replace with actual image path
  },
  // Add more products as needed
];

const Shop = () => {
  return (
    <div className="shop-container">
      <h1>Shop</h1>
      <div className="product-list">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default Shop;