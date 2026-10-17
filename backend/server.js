require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer=require("multer");
const cloudinary=require("./cloudinary");

const upload=multer({
  storage:multer.memoryStorage(),
  limits:{
    fileSize:5*1024*1024
  },
  fileFilter:(req,file,callback)=>{
    if(file.mimetype.startsWith("image/")){
      callback(null,true);
    }else{
      callback(new Error("Only image files are allowed"));
    }
  }
});


const { pool, initializeDatabase } = require("./database");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Test API
app.get("/", (req, res) => {
  res.send("SuryaMart Backend Server is Running!");
});

// Owner Login API
app.post("/api/owner-login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const ownerUsername = process.env.OWNER_USERNAME;
    const ownerPasswordHash = process.env.OWNER_PASSWORD_HASH;
    const jwtSecret = process.env.JWT_SECRET;

    if (!ownerUsername || !ownerPasswordHash || !jwtSecret) {
      return res.status(500).json({
        success: false,
        message: "Owner authentication is not configured",
      });
    }

    const usernameMatches = username === ownerUsername;
    const passwordMatches = await bcrypt.compare(
      password,
      ownerPasswordHash
    );

    if (!usernameMatches || !passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    const token = jwt.sign(
      {
        role: "owner",
        username: ownerUsername,
      },
      jwtSecret,
      {
        expiresIn: "1h",
      }
    );

    return res.json({
      success: true,
      message: "Owner login successful",
      token,
    });
  } catch (error) {
    console.error("Owner login error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// JWT Authentication Middleware
function verifyOwnerToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Token required.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Owner access required.",
      });
    }

    req.owner = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
}

// Protected Owner Dashboard API
app.get("/api/owner-dashboard", verifyOwnerToken, (req, res) => {
  return res.json({
    success: true,
    message: "Welcome to SuryaMart Owner Dashboard!",
    owner: req.owner.username,
  });
});

// CREATE CUSTOMER ORDER API - DUPLICATE ORDER PREVENTION
app.post("/api/orders", async (req, res) => {
  let client;

  try {
    const { requestId, customer, items } = req.body;

    // Validate request ID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (typeof requestId !== "string" || !uuidRegex.test(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order request ID. Please try again.",
      });
    }

    // Validate customer details
    const requiredFields = [
      "name",
      "mobile",
      "email",
      "houseNumber",
      "street",
      "city",
      "state",
      "pincode",
    ];

    if (
      !customer ||
      requiredFields.some(
        (field) =>
          typeof customer[field] !== "string" ||
          !customer[field].trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all customer and delivery details.",
      });
    }

    // Validate mobile number
    if (!/^[0-9]{10}$/.test(customer.mobile.trim())) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit mobile number.",
      });
    }

    // Validate PIN code
    if (!/^[0-9]{6}$/.test(customer.pincode.trim())) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 6-digit PIN code.",
      });
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address.",
      });
    }

    // Validate cart items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty.",
      });
    }

    const validatedItems = [];
    let totalAmount = 0;

    // Verify products using PostgreSQL
    for (const item of items) {
      const productId = Number(item.productId);
      const quantity = Number(item.quantity);

      if (
        !Number.isInteger(productId) ||
        productId <= 0 ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 100
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID or quantity.",
        });
      }

      if (
        !["S", "M", "L", "XL", "XXL"].includes(item.size) ||
        !["Blue", "Black", "White", "Red"].includes(item.color)
      ) {
        return res.status(400).json({
          success: false,
          message: "Please select a valid size and color.",
        });
      }

      const productResult = await pool.query(
        `SELECT id, name, brand, price
         FROM products
         WHERE id = $1`,
        [productId]
      );

      const product = productResult.rows[0];

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product ${productId} was not found.`,
        });
      }

      const price = Number(product.price);

      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid price for product ${productId}.`,
        });
      }

      totalAmount += price * quantity;

      validatedItems.push({
        productId: product.id,
        name: product.name,
        brand: product.brand,
        price,
        quantity,
        size: item.size,
        color: item.color,
      });
    }
    // Start PostgreSQL transaction
    client = await pool.connect();

    await client.query("BEGIN");

    // Insert order
    const orderResult = await client.query(
      `INSERT INTO orders (
        request_id,
        customer_name,
        mobile,
        email,
        house_number,
        street,
        city,
        state,
        pincode,
        total_amount
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id`,
      [
        requestId,
        customer.name.trim(),
        customer.mobile.trim(),
        customer.email.trim(),
        customer.houseNumber.trim(),
        customer.street.trim(),
        customer.city.trim(),
        customer.state.trim(),
        customer.pincode.trim(),
        totalAmount,
      ]
    );

    const orderId = Number(orderResult.rows[0].id);

    // Insert order items
    for (const item of validatedItems) {
      await client.query(
        `INSERT INTO order_items (
          order_id,
          product_id,
          product_name,
          brand,
          price,
          size,
          color,
          quantity
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          orderId,
          item.productId,
          item.name,
          item.brand,
          item.price,
          item.size,
          item.color,
          item.quantity,
        ]
      );
    }

    // Save everything together
    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      duplicate: false,
      message: "Order placed successfully!",
      orderId,
      totalAmount,
    });
  } catch (error) {
    // Undo incomplete transaction
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Order rollback error:", rollbackError);
      }
    }

    // Handle duplicate order requests
    if (error.code === "23505") {
      try {
        const { requestId } = req.body;

        const existingOrder = await pool.query(
          `SELECT id, total_amount
           FROM orders
           WHERE request_id = $1`,
          [requestId]
        );

        if (existingOrder.rows.length > 0) {
          return res.status(200).json({
            success: true,
            duplicate: true,
            message: "This order has already been placed.",
            orderId: Number(existingOrder.rows[0].id),
            totalAmount: Number(existingOrder.rows[0].total_amount),
          });
        }
      } catch (lookupError) {
        console.error("Duplicate order lookup error:", lookupError);
      }
    }

    console.error("Create order error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to place order.",
    });
  } finally {
    // Release database connection
    if (client) {
      client.release();
    }
  }
});

// GET Products API - Anyone can view products
app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, price, brand, image_url, created_at
      FROM products
      ORDER BY id DESC
    `);

    const products = result.rows;

    return res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get products error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get products.",
    });
  }
});
// Upload Product Image API
app.post(
  "/api/products/upload",
  verifyOwnerToken,
  upload.single("image"),
  async (req, res) => {
    try {
      const { name, brand, price } = req.body;

      if (!name?.trim() || !brand?.trim() || !price || !req.file) {
        return res.status(400).json({
          success: false,
          message: "Name, brand, price and image are required.",
        });
      }

      const numericPrice = Number(price);

      if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid price.",
        });
      }

      // Upload image to Cloudinary
      const imageUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "surya-mart/products",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result.secure_url);
            }
          }
        );

        stream.end(req.file.buffer);
      });

      // Save product details in PostgreSQL
      const result = await pool.query(
        `INSERT INTO products (name, price, brand, image_url)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, price, brand, image_url, created_at`,
        [
          name.trim(),
          numericPrice,
          brand.trim(),
          imageUrl,
        ]
      );

      return res.status(201).json({
        success: true,
        message: "Product and image uploaded successfully!",
        product: result.rows[0],
      });
    } catch (error) {
      console.error("Product image upload error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to upload product image.",
      });
    }
  }
);

// POST Product API - Owner only
app.post("/api/products", verifyOwnerToken, async (req, res) => {
  try {
    const { name, price, brand } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof brand !== "string" ||
      !brand.trim() ||
      price === undefined ||
      price === null ||
      price === "" ||
      !Number.isFinite(Number(price)) ||
      Number(price) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid name, price, and brand are required.",
      });
    }

    const result = await pool.query(
      `INSERT INTO products (name, price, brand)
       VALUES ($1, $2, $3)
       RETURNING id, name, price, brand, image_url, created_at`,
      [name.trim(), Number(price), brand.trim()]
    );

    return res.status(201).json({
      success: true,
      message: "Product added successfully!",
      product: result.rows[0],
    });
  } catch (error) {
    console.error("Add product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add product.",
    });
  }
});

// DELETE Product API - Owner only
app.delete("/api/products/:id", verifyOwnerToken, async (req, res) => {
  try {
    const productId = Number(req.params.id);

    // Validate Product ID
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    // Delete Product from PostgreSQL
    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING id",
      [productId]
    );

    // Check whether product existed
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.json({
      success: true,
      message: "Product deleted successfully!",
      deletedProductId: productId,
    });
  } catch (error) {
    console.error("Delete product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete product.",
    });
  }
});

// UPDATE Product API - Owner only
app.put("/api/products/:id", verifyOwnerToken, async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const { name, price, brand } = req.body;

    // Validate Product ID
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    // Validate Product Details
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof brand !== "string" ||
      !brand.trim() ||
      price === undefined ||
      price === null ||
      price === "" ||
      !Number.isFinite(Number(price)) ||
      Number(price) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid name, price, and brand are required.",
      });
    }

    // Update Product in PostgreSQL
    const result = await pool.query(
      `UPDATE products
       SET name = $1, price = $2, brand = $3
       WHERE id = $4
       RETURNING id, name, price, brand, image_url, created_at`,
      [name.trim(), Number(price), brand.trim(), productId]
    );

    // Check whether product exists
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.json({
      success: true,
      message: "Product updated successfully!",
      product: result.rows[0],
    });
  } catch (error) {
    console.error("Update product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update product.",
    });
  }
});

// OWNER - GET ALL CUSTOMER ORDERS API
app.get("/api/orders", verifyOwnerToken, async (req, res) => {
  try {
    // Get all customer orders from PostgreSQL
    const ordersResult = await pool.query(`
      SELECT *
      FROM orders
      ORDER BY created_at DESC
    `);

    const orders = ordersResult.rows;

    // Get all order items from PostgreSQL
    const itemsResult = await pool.query(`
      SELECT
        id,
        order_id,
        product_id,
        product_name,
        brand,
        price,
        size,
        color,
        quantity
      FROM order_items
      ORDER BY id ASC
    `);

    const allItems = itemsResult.rows;
    // Attach items to their corresponding orders
    const ordersWithItems = orders.map((order) => ({
      ...order,
      items: allItems.filter(
        (item) => Number(item.order_id) === Number(order.id)
      ),
    }));

    return res.status(200).json({
      success: true,
      count: ordersWithItems.length,
      orders: ordersWithItems,
    });
  } catch (error) {
    console.error("Get orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch orders.",
    });
  }
});

// OWNER - UPDATE ORDER STATUS API
app.put(
  "/api/orders/:id/status",
  verifyOwnerToken,
  async (req, res) => {
    try {
      const orderId = Number(req.params.id);
      const { status } = req.body;

      // Validate Order ID
      if (!Number.isInteger(orderId) || orderId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid order ID.",
        });
      }

      // Allow only these statuses
      const allowedStatuses = [
        "Pending",
        "Confirmed",
        "Shipped",
        "Delivered",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order status.",
        });
      }

      // Check whether order exists in PostgreSQL
      const existingOrder = await pool.query(
        "SELECT id FROM orders WHERE id = $1",
        [orderId]
      );

      if (existingOrder.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Order not found.",
        });
      }
      // Update order status in PostgreSQL
      await pool.query(
        "UPDATE orders SET status = $1 WHERE id = $2",
        [status, orderId]
      );

      return res.status(200).json({
        success: true,
        message: "Order status updated successfully!",
        orderId,
        status,
      });
    } catch (error) {
      console.error("Update order status error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to update order status.",
      });
    }
  }
);
// START SERVER AFTER DATABASE INITIALIZATION
async function startServer() {
  try {
    // Initialize PostgreSQL database and create tables
    await initializeDatabase();

    // Start backend server
    app.listen(PORT, () => {
      console.log(
        `SuryaMart Backend running at http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
