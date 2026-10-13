import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";

import Home from "./pages/HomePage.jsx";
import Products from "./pages/Products.jsx";
import About from "./pages/About.jsx";
import Cart from "./pages/Cart.jsx";

import "./App.css";

function App() {
  const [cart, setCart] = useState([]);

  // Add product to cart
  function handleAddToCart(product) {
    setCart((previousCart) => {
      const existingProduct = previousCart.find(
        (item) => item.id === product.id
      );

      if (existingProduct) {
        return previousCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...previousCart,
        { ...product, quantity: 1 },
      ];
    });
  }

  // Remove product from cart
  function handleRemoveFromCart(indexToRemove) {
    setCart((previousCart) =>
      previousCart.filter(
        (_, index) => index !== indexToRemove
      )
    );
  }

  // Increase or decrease quantity
  function handleQuantityChange(productId, change) {
    setCart((previousCart) =>
      previousCart.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity: Math.max(
                1,
                item.quantity + change
              ),
            }
          : item
      )
    );
  }

  return (
    <BrowserRouter>
      <Navbar cartCount={cart.reduce(
        (total, item) => total + item.quantity,
        0
      )} />

      <Routes>
        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/products"
          element={
            <Products
              onAddToCart={handleAddToCart}
            />
          }
        />

        <Route
          path="/about"
          element={<About />}
        />

        <Route
          path="/cart"
          element={
            <Cart
              cart={cart}
              onRemoveFromCart={handleRemoveFromCart}
              onQuantityChange={handleQuantityChange}
            />
          }
        />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}

export default App;