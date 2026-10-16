import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./ProductDetails.css";

function ProductDetails({ onAddToCart }) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const product = location.state?.product;

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);

  if (!product || String(product.id) !== id) {
    return (
      <main className="product-details">
        <h2>Product details unavailable</h2>
        <p>Please open the Products page and select a product.</p>

        <button onClick={() => navigate("/products")}>
          Back to Products
        </button>
      </main>
    );
  }

  function handleAddToCart() {
    if (!selectedSize || !selectedColor) {
      alert("Please select a size and color.");
      return;
    }

    if (typeof onAddToCart !== "function") {
      alert("Cart feature is not connected yet.");
      return;
    }

    onAddToCart({
      ...product,
      selectedSize,
      selectedColor,
      quantity,
    });

    alert("Product added to cart!");
  }

  return (
    <main className="product-details">
      <button
        type="button"
        onClick={() => navigate("/products")}
      >
        ← Back to Products
      </button>

      <div className="product-details-layout">
        <div className="product-details-image">
          {product.image && (
            <img src={product.image} alt={product.name} />
          )}
        </div>

        <div className="product-details-info">
          <p>{product.brand}</p>

          <h1>{product.name}</h1>

          <h2>₹{product.price}</h2>

          <label htmlFor="product-size">Select Size</label>

          <select
            id="product-size"
            value={selectedSize}
            onChange={(event) =>
              setSelectedSize(event.target.value)
            }
          >
            <option value="">Choose a size</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
            <option value="XXL">XXL</option>
          </select>

          <label htmlFor="product-color">Select Color</label>

          <select
            id="product-color"
            value={selectedColor}
            onChange={(event) =>
              setSelectedColor(event.target.value)
            }
          >
            <option value="">Choose a color</option>
            <option value="Blue">Blue</option>
            <option value="Black">Black</option>
            <option value="White">White</option>
            <option value="Red">Red</option>
          </select>

          <label htmlFor="product-quantity">Quantity</label>

          <div className="quantity-controls">
            <button
              type="button"
              onClick={() =>
                setQuantity((current) =>
                  Math.max(1, current - 1)
                )
              }
            >
              −
            </button>

            <span>{quantity}</span>

            <button
              type="button"
              onClick={() =>
                setQuantity((current) => current + 1)
              }
            >
              +
            </button>
          </div>

          <h3>
            Total: ₹{Number(product.price) * quantity}
          </h3>

          <button
            type="button"
            onClick={handleAddToCart}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </main>
  );
}

export default ProductDetails;