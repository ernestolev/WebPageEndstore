// filepath: /f1-store/f1-store/src/pages/Cart.jsx
import React from 'react';

const Cart = () => {
  // Sample cart items
  const cartItems = [
    { id: 1, name: 'F1 Racing Cap', price: 29.99, quantity: 1 },
    { id: 2, name: 'F1 Team T-Shirt', price: 49.99, quantity: 2 },
  ];

  const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <div className="cart">
      <h1>Your Shopping Cart</h1>
      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <ul>
          {cartItems.map(item => (
            <li key={item.id}>
              {item.name} - ${item.price.toFixed(2)} x {item.quantity}
            </li>
          ))}
        </ul>
      )}
      <h2>Total: ${totalPrice.toFixed(2)}</h2>
      <button className="checkout-button">Proceed to Checkout</button>
    </div>
  );
};

export default Cart;