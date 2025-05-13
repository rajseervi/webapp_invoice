import React, { useState } from 'react';
import { ProductSelector } from './ProductSelector';
import { ProductContainer } from './ProductContainer';

const App = () => {
  const [selectedProducts, setSelectedProducts] = useState([]);

  const sampleProducts = [
    { id: 1, name: 'Laptop', price: 999.99 },
    { id: 2, name: 'Phone', price: 699.99 },
    { id: 3, name: 'Tablet', price: 399.99 }
  ];

  const handleProductSelect = (product) => {
    setSelectedProducts(prev => [...prev, product]);
  };

  return (
    <div className="app">
      <ProductSelector 
        products={sampleProducts} 
        onSelect={handleProductSelect} 
      />
      <ProductContainer selectedProducts={selectedProducts} />
    </div>
  );
};

export default App;