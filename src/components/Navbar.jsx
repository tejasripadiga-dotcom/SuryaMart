import { NavLink } from "react-router-dom";
import "./Navbar.css";

function Navbar({ cartCount }) {
  return (
    <header className="navbar">
      <NavLink to="/" className="navbar-logo">
        SURYA<span>MART</span>
      </NavLink>

      <nav className="navbar-links">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/products">Products</NavLink>
        <NavLink to="/about">About</NavLink>
      </nav>

      <NavLink to="/cart" className="navbar-cart">
        🛒 Cart ({cartCount})
      </NavLink>
    </header>
  );
}

export default Navbar;