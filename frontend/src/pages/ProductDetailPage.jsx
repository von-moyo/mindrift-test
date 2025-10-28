import React from 'react';
import { useParams } from 'react-router-dom';

const ProductDetailPage = () => {
  const { id } = useParams();

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-4">Product Details - {id}</h1>
      {/* Add product details here */}
    </div>
  );
};

export default ProductDetailPage;
