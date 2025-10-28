import React from 'react';
import { useParams } from 'react-router-dom';

const OrderDetailsPage = () => {
  const { id } = useParams();

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-4" data-testid="order-details-page">
        OrderDetails - {id}
      </h1>
      {/* Add Order details here */}
    </div>
  );
};

export default OrderDetailsPage;
