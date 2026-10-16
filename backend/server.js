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

const db = require("./database");

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

// CREATE CUSTOMER ORDER API
// CREATE CUSTOMER ORDER API - DUPLICATE ORDER PREVENTION
app.post("/api/orders", (req, res) => {
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

    // Check whether this order was already placed
    const existingOrder = db
      .prepare(`
        SELECT id, total_amount
        FROM orders
        WHERE request_id = ?
      `)
      .get(requestId);

    if (existingOrder) {
      return res.status(200).json({
        success: true,
        duplicate: true,
        message: "This order has already been placed.",
        orderId: Number(existingOrder.id),
        totalAmount: Number(existingOrder.total_amount),
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

      const product = db
        .prepare(`
          SELECT id, name, brand, price
          FROM products
          WHERE id = ?
        `)
        .get(productId);

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

      const subtotal = price * quantity;
      totalAmount += subtotal;

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
    // Save order and items in one database transaction
    const createOrder = db.transaction(() => {
      const orderResult = db
        .prepare(`
          INSERT INTO orders (
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
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          requestId,
          customer.name.trim(),
          customer.mobile.trim(),
          customer.email.trim(),
          customer.houseNumber.trim(),
          customer.street.trim(),
          customer.city.trim(),
          customer.state.trim(),
          customer.pincode.trim(),
          totalAmount
        );

      const orderId = Number(orderResult.lastInsertRowid);

      const insertItem = db.prepare(`
        INSERT INTO order_items (
          order_id,
          product_id,
          product_name,
          brand,
          price,
          size,
          color,
          quantity
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of validatedItems) {
        insertItem.run(
          orderId,
          item.productId,
          item.name,
          item.brand,
          item.price,
          item.size,
          item.color,
          item.quantity
        );
      }

      return orderId;
    });

    const orderId = createOrder();

    return res.status(201).json({
      success: true,
      duplicate: false,
      message: "Order placed successfully!",
      orderId,
      totalAmount,
    });
  } catch (error) {
    // Handle duplicate requests arriving at the same time
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      try {
        const { requestId } = req.body;

        const existingOrder = db
          .prepare(`
            SELECT id, total_amount
            FROM orders
            WHERE request_id = ?
          `)
          .get(requestId);

        if (existingOrder) {
          return res.status(200).json({
            success: true,
            duplicate: true,
            message: "This order has already been placed.",
            orderId: Number(existingOrder.id),
            totalAmount: Number(existingOrder.total_amount),
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
  }
});

// GET Products API - Anyone can view products
app.get("/api/products", (req, res) => {
  try {
    const products = db
      .prepare(`
        SELECT id, name, price, brand,image_url, created_at
        FROM products
        ORDER BY id DESC
      `)
      .all();

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

      const imageUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "surya-mart/products", resource_type: "image" },
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

      const result = db
        .prepare(
          `INSERT INTO products (name, price, brand, image_url)
           VALUES (?, ?, ?, ?)`
        )
        .run(name.trim(), numericPrice, brand.trim(), imageUrl);

      return res.status(201).json({
        success: true,
        message: "Product and image uploaded successfully!",
        product: {
          id: result.lastInsertRowid,
          name: name.trim(),
          price: numericPrice,
          brand: brand.trim(),
          image_url: imageUrl,
        },
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
app.post("/api/products", verifyOwnerToken, (req, res) => {
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

    const result = db
      .prepare(`
        INSERT INTO products (name, price, brand)
        VALUES (?, ?, ?)
      `)
      .run(name.trim(), Number(price),brand.trim());

      const newProduct={
        id:Number(result.lastInsertRowid),
        name:name.trim(),
        price:Number(price),
        brand:brand.trim(),
      };
      return res.status(201).json({
        success:true,
        message:"Product added successfully!",
        product:newProduct,
      });
    }catch(error){
        console.error("Add product error:",error);

        return res.status(500).json({
            success:false,
            message:"Failed to add product:",
        });
    }
});

// DELETE Product API - Owner only
app.delete("/api/products/:id", verifyOwnerToken, (req, res) => {
  try {
    const productId = Number(req.params.id);

    // Validate Product ID
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    // Delete Product from SQLite Database
    const result = db
      .prepare("DELETE FROM products WHERE id = ?")
      .run(productId);

    // Check whether product existed
    if (result.changes === 0) {
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
app.put("/api/products/:id", verifyOwnerToken, (req, res) => {
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

    // Update Product in SQLite Database
    const result = db
      .prepare(`
        UPDATE products
        SET name = ?, price = ?, brand = ?
        WHERE id = ?
      `)
      .run(name.trim(), Number(price), brand.trim(), productId);

    // Check whether product exists
    if (result.changes === 0) {
      const existingProduct = db
        .prepare("SELECT id FROM products WHERE id = ?")
        .get(productId);

      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: "Product not found.",
        });
      }
    }

    // Get Updated Product
    const updatedProduct = db
      .prepare(`
        SELECT id, name, price, brand, created_at
        FROM products
        WHERE id = ?
      `)
      .get(productId);

    return res.json({
      success: true,
      message: "Product updated successfully!",
      product: updatedProduct,
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
app.get("/api/orders", verifyOwnerToken, (req, res) => {
  try {
    const orders = db
      .prepare(`
        SELECT *
        FROM orders
        ORDER BY created_at DESC
      `)
      .all();

    const getOrderItems = db.prepare(`
      SELECT
        id,
        product_id,
        product_name,
        brand,
        price,
        size,
        color,
        quantity
      FROM order_items
      WHERE order_id = ?
    `);

    const ordersWithItems = orders.map((order) => ({
      ...order,
      items: getOrderItems.all(order.id),
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
app.put("/api/orders/:id/status", verifyOwnerToken, (req, res) => {
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

    // Check whether order exists
    const existingOrder = db
      .prepare("SELECT id FROM orders WHERE id = ?")
      .get(orderId);

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Update status
    db.prepare(
      "UPDATE orders SET status = ? WHERE id = ?"
    ).run(status, orderId);

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
});

app.listen(PORT,()=>{
    console.log(`SuryaMart Backend running at
        http://localhost:${PORT}`);
});