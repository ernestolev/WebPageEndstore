// filepath: /f1-store/f1-store/src/pages/ProductDetails.jsx
import React from 'react';
import { useParams } from 'react-router-dom';

const ProductDetails = () => {
  const { id } = useParams();
  
  // Sample product data, replace with actual data fetching logic
  const product = {
    id: id,
    title: 'Formula 1 Racing Car',
    description: 'High-speed racing car used in Formula 1 competitions.',
    price: '$250,000',
    images: [
      'image1.jpg',
      'image2.jpg',
      'image3.jpg'
    ]
  };

  return (
    <div className="product-details">
      <h1>{product.title}</h1>
      <div className="product-images">
        {product.images.map((image, index) => (
          <img key={index} src={image} alt={product.title} />
        ))}
      </div>
      <p>{product.description}</p>
      <h2>{product.price}</h2>
      <button>Add to Cart</button>
    </div>
  );
};

export default ProductDetails;