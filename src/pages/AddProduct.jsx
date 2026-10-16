import { useState } from "react";

function AddProduct() {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [message, setMessage] = useState("");

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      setImageFile(null);
      setImagePreview("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage("Please select a valid image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setMessage("");
  }

  async function handleSubmit(event) {
  event.preventDefault();
  setMessage("");

  if (!name.trim() || !brand.trim() || !price || !imageFile) {
    setMessage("Please enter all details and select a product photo.");
    return;
  }

  if (!Number.isFinite(Number(price)) || Number(price) <= 0) {
    setMessage("Please enter a valid price.");
    return;
  }

  const token = sessionStorage.getItem("ownerToken");

  if (!token) {
    setMessage("Owner login required. Please log in again.");
    return;
  }

  try {
    setMessage("Uploading product and image...");

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("brand", brand.trim());
    formData.append("price", price);
    formData.append("image", imageFile);

    const response = await fetch(
      "http://localhost:5000/api/products/upload",
      {
        method: "POST",
        headers: {
          Authorization:` Bearer ${token}`,
        },
        body: formData,
      }
    );

    const data = await response.text().then(text => {
      try { return JSON.parse(text);

      } catch {
         throw new Error("Server returned HTML instead of JSON. Check backend route.");
         }
         });

    if (!response.ok) {
      throw new Error(data.message || "Product upload failed.");
    }

    setMessage("Product and image uploaded successfully!");

    setName("");
    setBrand("");
    setPrice("");
    setImageFile(null);
    setImagePreview("");

    const imageInput = document.getElementById("productImage");

    if (imageInput) {
      imageInput.value = "";
    }
  } catch (error) {
    console.error("Product upload error:", error);
    setMessage(error.message || "Something went wrong.");
  }
}

  return (
    <main
      style={{
        maxWidth: "600px",
        margin: "40px auto",
        padding: "24px",
        background: "#ffffff",
        borderRadius: "12px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
      }}
    >
      <h1>Add New Product</h1>

      <p>SuryaMart Owner Panel</p>

      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gap: "12px" }}
      >
        <label htmlFor="productName">Product Name</label>

        <input
          id="productName"
          type="text"
          placeholder="Enter product name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />

        <label htmlFor="productBrand">Brand</label>

        <input
          id="productBrand"
          type="text"
          placeholder="Enter brand"
          value={brand}
          onChange={(event) => setBrand(event.target.value)}
          required
        />

        <label htmlFor="productPrice">Price (₹)</label>

        <input
          id="productPrice"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Enter price"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          required
        />

        <label htmlFor="productImage">Product Photo</label>

        <input
        id="productImage"
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        required />
        {imagePreview&&(
            <div>
                <p>Photo Preview</p>
                <img
                src={imagePreview}
                alt="Select product"
                style={{
                    width:"100%",
                    maxWidth:"250px",
                    height:"220px",
                    objectFit:"contain",
                    border:"1px solid #dddddd",
                    borderRadius:"8px",
                }}/>
            </div>
        )}
        <button type="submit">Add Product</button>
        {message&&<p role="status">{message}</p>}
        </form>
        </main>
  );
}
export default AddProduct;