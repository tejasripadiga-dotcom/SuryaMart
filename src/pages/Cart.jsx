import "./Cart.css";
import {useNavigate} from "react-router-dom";

function Cart({ cart, onRemoveFromCart, onQuantityChange }) {
  const navigate=useNavigate();
  const totalPrice = cart.reduce(
    (total, product) =>
      total + product.price * product.quantity,
    0
  );

  return (
    <main className="cart-page">
      <section className="cart-heading">
        <p className="cart-label">YOUR SHOPPING BAG</p>
        <h1>Shopping Cart</h1>
        <p>Review your items before checkout.</p>
      </section>

      {cart.length === 0 ? (
        <section className="cart-empty">
          <div className="cart-empty-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>
            Explore our collection and add your favourite products.
          </p>
          <a href="/products" className="cart-shop-button">
            Explore Products →
          </a>
        </section>
      ) : (
        <section className="cart-items">
          {cart.map((product, index) => (
            <article
              className="cart-item"
              key={product.id}
            >
              <img src={product.image} alt={product.name} />

              <div className="cart-item-details">
                <h2>{product.name}</h2>
                <p>{product.brand}</p>
                <strong>₹{product.price}</strong>

                <div className="cart-quantity">
                  <button
                    type="button"
                    onClick={() =>
                      onQuantityChange(product.id, -1)
                    }
                  >
                    −
                  </button>

                  <span>{product.quantity}</span>

                  <button
                    type="button"
                    onClick={() =>
                      onQuantityChange(product.id, 1)
                    }
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  className="cart-remove-button"
                  onClick={() => onRemoveFromCart(index)}
                >
                  Remove
                </button>
              </div>
            </article>
          ))}

         <div className="cart-total">
            <h2>Total: ₹{totalPrice}</h2>

            <p>
              {cart.reduce(
                (total, item) => total + item.quantity,
                0
              )}{" "}
              item(s) in your cart
            </p>

            <button
              type="button"
              className="checkout-button"
              onClick={() => navigate("/checkout")}
            >
              Proceed to Checkout →
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

export default Cart;