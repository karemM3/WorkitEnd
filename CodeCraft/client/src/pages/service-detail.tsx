import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';


function OrderButton({ service }) {
  const navigate = useNavigate();

  const handleOrderNow = () => {
    // Handle both MongoDB ObjectId and numeric IDs
    navigate(`/payment/${service.id}`);
  };

  return (
    <button onClick={handleOrderNow}>Order Now</button>
  );
}

export default OrderButton;