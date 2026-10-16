import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    price: "",
  });

  const navigate = useNavigate();

  async function fetchProducts() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/products"
      );

      if (!response.ok) {
        throw new Error("Products load failed.");
      }

      const data = await response.json();

      setProducts(data.products || []);
    } catch (error) {
      setError(
        "Backend connection failed. Please check the server."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  function handleEdit(product) {
    setEditingId(product.id);

    setFormData({
      name: product.name,
      brand: product.brand,
      price: String(product.price),
    });

    setMessage("");
    setError("");
  }

  function handleInputChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function cancelEdit() {
    setEditingId(null);

    setFormData({
      name: "",
      brand: "",
      price: "",
    });

    setError("");
    setMessage("");
  }

  async function handleUpdate(event) {
    event.preventDefault();

    const token = sessionStorage.getItem("ownerToken");

    if (!token) {
      setError("Please log in as owner again.");
      return;
    }

    if (
      !formData.name.trim() ||
      !formData.brand.trim() ||
      !formData.price.trim() ||
      !Number.isFinite(Number(formData.price)) ||
      Number(formData.price) <= 0
    ) {
      setError(
        "Please enter a valid name, brand, and price greater than zero."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `http://localhost:5000/api/products/${editingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization:` Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            brand: formData.brand.trim(),
            price: Number(formData.price),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Product update failed."
        );
      }

      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === editingId
            ? { ...product, ...data.product }
            : product
        )
      );

      setMessage(
        data.message || "Product updated successfully!"
      );

      setEditingId(null);

      setFormData({
        name: "",
        brand: "",
        price: "",
      });
    } catch (error) {
      setError(error.message || "Product update failed.");
    } finally {
      setSaving(false);
    }
  }
  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) {
      return;
    }

    const token = sessionStorage.getItem("ownerToken");

    if (!token) {
      setMessage("Please log in as owner again.");
      return;
    }

    try {
      setDeletingId(product.id);
      setMessage("");
      setError("");

      const response = await fetch(
        `http://localhost:5000/api/products/${product.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Product deletion failed."
        );
      }

      setProducts((currentProducts) =>
        currentProducts.filter(
          (item) => item.id !== product.id
        )
      );

      if (editingId === product.id) {
        cancelEdit();
      }

      setMessage(`${product.name} deleted successfully!`);
    } catch (error) {
      setError(error.message || "Product deletion failed.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="admin-dashboard">
      <h1>SuryaMart Owner Dashboard</h1>

      <p>Welcome, Owner! 👋</p>

      <div className="admin-section">
        <h2>Manage Products</h2>

        <p>Owner మాత్రమే ఇక్కడ products manage చేయగలరు.</p>

        {loading && <p>Loading products...</p>}

        {error && <p role="alert">{error}</p>}

        {message && <p role="status">{message}</p>}

        {!loading && !error && products.length === 0 && (
          <p>No products found.</p>
        )}

        {!loading && products.length > 0 && (
          <div className="product-list">
            <h3>Available Products</h3>

            {products.map((product) => (
              <div className="product-item" key={product.id}>
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    style={{
                      width: "120px",
                      height: "120px",
                      objectFit: "contain",
                    }}
                  />
                )}

                <h4>{product.name}</h4>

                <p>Product ID: {product.id}</p>

                <p>Price: ₹{product.price}</p>

                <p>Brand: {product.brand}</p>

                <button
                  type="button"
                  onClick={() => handleEdit(product)}
                  disabled={saving || deletingId === product.id}
                >
                  Edit Product
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(product)}
                  disabled={deletingId === product.id || saving}
                >
                  {deletingId === product.id
                    ? "Deleting..."
                    : "Delete Product"}
                </button>

                {editingId === product.id && (
                  <form onSubmit={handleUpdate}>
                    <h3>Edit Product Details</h3>

                    <label htmlFor="edit-name">
                      Product Name
                    </label>

                    <input
                      id="edit-name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />

                    <label htmlFor="edit-brand">
                      Brand
                    </label>

                    <input
                      id="edit-brand"
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      required
                    />
                    <label htmlFor="edit-price">
                      Price
                    </label>

                    <input
                      id="edit-price"
                      type="number"
                      name="price"
                      min="0.01"
                      step="0.01"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                    />

                    <button
                      type="submit"
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>

                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={fetchProducts}
          disabled={loading || saving || deletingId !== null}
        >
          Refresh Products
        </button>

        <button
          type="button"
          onClick={() => navigate("/admin/add-product")}
        >
          Add New Product
        </button>
      </div>
    </div>
  );
}

export default AdminDashboard;