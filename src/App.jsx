import { useState } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";

import Home from "./pages/HomePage.jsx";
import Products from "./pages/Products.jsx";
import About from "./pages/About.jsx";
import Cart from "./pages/Cart.jsx";

import AdminDashboard from "./pages/AdminDashboard.jsx";
import OwnerLogin from "./pages/OwnerLogin.jsx";
import AddProduct from "./pages/AddProduct.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import Checkout from "./pages/Checkout.jsx";
import OwnerOrders from "./pages/OwnerOrders.jsx";

import "./App.css";

function App() {
  const [cart, setCart] = useState([]);

  // Check Owner Login
  const isOwnerLoggedIn = Boolean(
    sessionStorage.getItem("ownerToken")
  );

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
        {
          ...product,
          quantity: 1,
        },
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
      <Navbar
        cartCount={cart.reduce(
          (total, item) => total + item.quantity,
          0
        )}
      />

      <Routes>
        {/* Home Page */}
        <Route
          path="/"
          element={<Home />}
        />

        {/* Products Page */}
        <Route
          path="/products"
          element={
            <Products
              onAddToCart={handleAddToCart}
            />
          }
        />

        {/* About Page */}
        <Route
          path="/about"
          element={<About />}
        />

        {/* Cart Page */}
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

        {/* Owner Login Page */}
        <Route
          path="/owner-login"
          element={<OwnerLogin />}
        />

        {/* Protected Admin Dashboard */}
        <Route
          path="/admin"
          element={
            isOwnerLoggedIn ? (
              <AdminDashboard />
            ) : (
              <Navigate
                to="/owner-login"
                replace
              />
            )
          }
        />
      {/* Add Product Page */}
        <Route
          path="/admin/add-product"
          element={
            isOwnerLoggedIn ? (
              <AddProduct />
            ) : (
              <Navigate to="/owner-login" replace />
            )
          }
        />

        {/* Product Details Page */}
        <Route
          path="/products/:id"
          element={
            <ProductDetails
              onAddToCart={handleAddToCart}
            />
          }
        />
        <Route
        path="/checkout"
         element={
         <Checkout
          cart={cart}
              />
              }/>

              <Route
        path="/owner-orders"
        element={<OwnerOrders />}
        />

        {/* Unknown Page */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}

export default App;