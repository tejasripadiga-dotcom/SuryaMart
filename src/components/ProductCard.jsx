import "./ProductCard.css";

function ProductCard({ product, onAddToCart }) {
  return (
    <article className="product-card">
      <div className="product-image">
        <img src={product.image} alt={product.name} />
        <span className="product-badge">POPULAR</span>
      </div>

      <div className="product-details">
        <p className="product-brand">{product.brand}</p>
        <h2>{product.name}</h2>

        <div className="product-actions">
          <strong>₹{product.price}</strong>

          <button
            type="button"
            onClick={() => onAddToCart(product)}
          >
            + Add to Cart
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;