import { useEffect, useState } from "react";

function OwnerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

const [updatingOrderId, setUpdatingOrderId] = useState(null);

async function updateOrderStatus(orderId, newStatus) {
  try {
    const token = sessionStorage.getItem("ownerToken");

    if (!token) {
      alert("Please login as owner first.");
      return;
    }

    setUpdatingOrderId(orderId);

    const response = await fetch(
      `http://localhost:5000/api/orders/${orderId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Status update failed.");
    }

    setOrders((previousOrders) =>
      previousOrders.map((order) =>
        order.id === orderId
          ? { ...order, status: data.status }
          : order
      )
    );

    alert("Order status updated successfully!");
  } catch (error) {
    console.error("Status update error:", error);
    alert(error.message || "Unable to update order status.");
  } finally {
    setUpdatingOrderId(null);
  }
}

  useEffect(() => {
    async function fetchOrders() {
      try {
        const token = sessionStorage.getItem("ownerToken");

        if (!token) {
          setError("Please login as owner first.");
          return;
        }

        const response = await fetch(
          "http://localhost:5000/api/orders",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load orders.");
        }

        setOrders(data.orders || []);
      } catch (error) {
        setError(error.message || "Failed to load orders.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  if (loading) {
    return <h2>Loading customer orders...</h2>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <main style={{ padding: "20px" }}>
      <h1>Customer Orders</h1>

      <h3>Total Orders: {orders.length}</h3>

      {orders.length === 0 ? (
        <p>No customer orders found.</p>
      ) : (
        orders.map((order) => (
          <section
            key={order.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <h2>Order #{order.id}</h2>

            <p>
              <strong>Customer:</strong> {order.customer_name}
            </p>

            <p>
              <strong>Mobile:</strong> {order.mobile}
            </p>

            <p>
              <strong>Email:</strong> {order.email}
            </p>

            <p>
              <strong>Delivery Address:</strong>{" "}
              {order.house_number}, {order.street}, {order.city},{" "}
              {order.state} - {order.pincode}
            </p>

            <p>
              <strong>Total:</strong> ₹{order.total_amount}
            </p>

            <div style={{ margin: "12px 0" }}>
  <label htmlFor={`status-${order.id}`}>
    <strong>Order Status: </strong>
  </label>

  <select
    id={`status-${order.id}`}
    value={order.status}
    disabled={updatingOrderId === order.id}
    onChange={(event) =>
      updateOrderStatus(order.id, event.target.value)
    }
    style={{
      padding: "8px",
      marginLeft: "8px",
      borderRadius: "5px",
      cursor: "pointer",
    }}
  >
    <option value="Pending">Pending</option>
    <option value="Confirmed">Confirmed</option>
    <option value="Shipped">Shipped</option>
    <option value="Delivered">Delivered</option>
  </select>

  {updatingOrderId === order.id && (
    <span> Updating...</span>
  )}
</div>

            <h3>Ordered Products</h3>

            {order.items.map((item) => (
              <article key={item.id}>
                <p>
                  {item.product_name} — {item.brand}
                </p>

                <p>
                  Price: ₹{item.price} | Quantity: {item.quantity}
                </p>

                <p>
                  Size: {item.size} | Color: {item.color}
                </p>
              </article>
            ))}
          </section>
        ))
      )}
    </main>
  );
}

export default OwnerOrders;