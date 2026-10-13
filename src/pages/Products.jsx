import { useState } from "react";
import "./Products.css";
import ProductCard from "../components/ProductCard.jsx";

const products = [
  {
    id: 1,
    name: "Classic T-Shirt",
    brand: "Urban Style",
    price: 599,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
  },
  {
    id: 2,
    name: "Casual Shirt",
    brand: "Fashion Hub",
    price: 999,
    image:
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500",
  },
  {
    id: 3,
    name: "Running Shoes",
    brand: "Sport Zone",
    price: 1499,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
  },
  {
    id: 4,
    name: "Travel Bag",
    brand: "Urban Style",
    price: 1299,
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500",
  },
];

function Products({ onAddToCart }) {
  const [searchText, setSearchText] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name
        .toLowerCase()
        .includes(searchText.toLowerCase()) ||
      product.brand
        .toLowerCase()
        .includes(searchText.toLowerCase());

    let matchesPrice = true;

    if (priceFilter === "under1000") {
      matchesPrice = product.price < 1000;
    } else if (priceFilter === "1000to1500") {
      matchesPrice =
        product.price >= 1000 && product.price <= 1500;
    }

    return matchesSearch && matchesPrice;
  });

  return (
    <main className="products-page">
      <section className="products-heading">
        <p>OUR COLLECTION</p>
        <h1>Explore Products</h1>
        <span>
          Find your favourite products at SuryaMart.
        </span>

        <input
          type="text"
          className="product-search"
          placeholder="Search products or brands..."
          value={searchText}
          onChange={(event) =>
            setSearchText(event.target.value)
          }
        />

        <div className="price-filter">
          <label htmlFor="priceFilter">
            Filter by Price:
          </label>

          <select
            id="priceFilter"
            value={priceFilter}
            onChange={(event) =>
              setPriceFilter(event.target.value)
            }
          >
            <option value="all">All Products</option>
            <option value="under1000">
              Under ₹1,000
            </option>
            <option value="1000to1500">
              ₹1,000 – ₹1,500
            </option>
          </select>
        </div>
      </section>

      {filteredProducts.length === 0 ? (
        <section className="no-products">
          <h2>No products found</h2>
          <p>
            Try another product name, brand, or price range.
          </p>
        </section>
      ) : (
        <section className="products-grid">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
            />
          ))}
        </section>
      )}
    </main>
  );
}

export default Products;