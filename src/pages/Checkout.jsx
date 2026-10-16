import { useState } from "react";
import "./Checkout.css";
import API_BASE_URL from "../api";

function Checkout({ cart = [] }) {

    const [isSubmitting, setIsSubmitting] = useState(false);

  const [customer, setCustomer] = useState({
    name: "",
    mobile: "",
    email: "",
    houseNumber: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
  });


  const totalPrice = cart.reduce(
    (total, product) =>
      total + Number(product.price) * product.quantity,
    0
  );

  function handleChange(event) {
    const { name, value } = event.target;

    setCustomer((previousCustomer) => ({
      ...previousCustomer,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
  event.preventDefault();

  if (isSubmitting) {
    return;
  }

  if (cart.length === 0) {
    alert("Your cart is empty. Please add a product first.");
    return;
  }

  // Reuse the same request ID if this checkout is retried.
  const savedRequestId = sessionStorage.getItem("pendingOrderRequestId");
  const requestId = savedRequestId || crypto.randomUUID();

  if (!savedRequestId) {
    sessionStorage.setItem("pendingOrderRequestId", requestId);
  }

  const orderData = {
    requestId: requestId,
    customer: customer,
    items: cart.map((product) => ({
      productId: product.id,
      quantity: Number(product.quantity),
      size: product.selectedSize,
      color: product.selectedColor,
    })),
  };

  setIsSubmitting(true);

  try {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Order failed. Please try again.");
      return;
    }

    // Clear the saved ID only after the server confirms success.
    sessionStorage.removeItem("pendingOrderRequestId");

    alert(
      `Order placed successfully!\nOrder ID: ${data.orderId}\nTotal: ₹${data.totalAmount}`
    );

    console.log("Saved Order:", data);
  } catch (error) {
    console.error("Order Error:", error);

    alert(
      "Backend connection failed or the response was interrupted. Please check the backend and retry."
    );
  } finally {
    setIsSubmitting(false);
  }
}

  return (
    <main className="checkout-page">
      <h1>Customer Checkout</h1>

      <section className="checkout-order-summary">
        <h2>Your Order</h2>

        {cart.length === 0 ? (
          <p>Your cart is empty. Please add products first.</p>
        ) : (
          <>
            {cart.map((product) => (
              <article
                className="checkout-product"
                key={product.id}
              >
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                  />
                )}

                <div>
                  <h3>{product.name}</h3>
                  <p>Brand: {product.brand}</p>
                  <p>Price: ₹{product.price}</p>
                  <p>Quantity: {product.quantity}</p>

                  <strong>
                    Subtotal: ₹
                    {Number(product.price) * product.quantity}
                  </strong>
                </div>
              </article>
            ))}

            <h2 className="checkout-total">
              Total: ₹{totalPrice}
            </h2>
          </>
        )}
      </section>

      <h2>Delivery Details</h2>

      <form onSubmit={handleSubmit}>
        <label htmlFor="name">Customer Name</label>
        <input
          id="name"
          name="name"
          type="text"
          value={customer.name}
          onChange={handleChange}
          required
        />

        <label htmlFor="mobile">Mobile Number</label>
        <input
          id="mobile"
          name="mobile"
          type="tel"
          value={customer.mobile}
          onChange={handleChange}
          pattern="[0-9]{10}"
          title="Enter a valid 10-digit mobile number"
          required
        />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={customer.email}
          onChange={handleChange}
          required
        />

        <label htmlFor="houseNumber">House Number</label>
        <input
          id="houseNumber"
          name="houseNumber"
          type="text"
          value={customer.houseNumber}
          onChange={handleChange}
          required
        />

        <label htmlFor="street">Street / Area</label>
        <input
          id="street"
          name="street"
          type="text"
          value={customer.street}
          onChange={handleChange}
          required
        />

        <label htmlFor="city">City</label>
        <input
          id="city"
          name="city"
          type="text"
          value={customer.city}
          onChange={handleChange}
          required
        />

        <label htmlFor="state">State</label>
        <input
          id="state"
          name="state"
          type="text"
          value={customer.state}
          onChange={handleChange}
          required
        />

        <label htmlFor="pincode">PIN Code</label>
        <input
          id="pincode"
          name="pincode"
          type="text"
          value={customer.pincode}
          onChange={handleChange}
          pattern="[0-9]{6}"
          title="Enter a valid 6-digit PIN code"
          required />
          <button
          type="submit"
          disabled={cart.length === 0 || isSubmitting}
          >
          {isSubmitting ? "Placing Order..." : "Continue to Place Order"}
          </button>
          </form>
          </main>
  );
}
export default Checkout