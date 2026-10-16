import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Products.css";
import ProductCard from "../components/ProductCard.jsx";
import API_BASE_URL from "../api";

function Products({ onAddToCart }) {
  const [products, setProducts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/api/products`
        );

        if (!response.ok) {
          throw new Error("Failed to load products.");
        }

        const data = await response.json();

        if (
          !data.success ||
          !Array.isArray(data.products)
        ) {
          throw new Error("Invalid products response.");
        }

        const formattedProducts = data.products.map(
          (product) => ({
            ...product,
            image: product.image_url || product.image || "",
          })
        );

        setProducts(formattedProducts);
      } catch (error) {
        console.error("Products loading error:", error);

        setError(
          "Products load avvaledu. Backend server running-lo undho check cheyyi."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);
  const filteredProducts = products.filter((product) => {
    const search = searchText.toLowerCase();

    const matchesSearch =
      (product.name || "").toLowerCase().includes(search) ||
      (product.brand || "").toLowerCase().includes(search);

    let matchesPrice = true;

    if (priceFilter === "under1000") {
      matchesPrice = Number(product.price) < 1000;
    } else if (priceFilter === "1000to1500") {
      matchesPrice =
        Number(product.price) >= 1000 &&
        Number(product.price) <= 1500;
    }

    return matchesSearch && matchesPrice;
  });

  function handleProductClick(product) {
    navigate(`/products/${product.id}`, {
      state: { product },
    });
  }

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
            Filter by Price
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
              ₹1,000–₹1,500
            </option>
          </select>
        </div>
      </section>

      {loading ? (
        <section className="no-products">
          <h2>Loading products...</h2>
        </section>
      ) : error ? (
        <section className="no-products">
          <h2>Unable to Load Products</h2>
          <p>{error}</p>
        </section>
      ) : filteredProducts.length === 0 ? (
        <section className="no-products">
          <h2>No products found</h2>

          <p>
            Try another product name, brand or price range.
          </p>
        </section>
      ) : (
        <section className="products-grid">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => handleProductClick(product)}
              style={{ cursor: "pointer" }}
            >
              <ProductCard
                product={product}
                onAddToCart={onAddToCart}
              />
            </div>
          ))}
        </section>
      )}
    </main>
  );
}

export default Products;