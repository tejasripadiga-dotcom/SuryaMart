const Database = require("better-sqlite3");
const path = require("path");

// Database file create/open
const dbPath = path.join(__dirname, "surya-mart.db");

const db = new Database(dbPath);

// Products table create
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    brand TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Check whether image_url column exists
const columns = db
  .prepare("PRAGMA table_info(products)")
  .all();

const hasImageUrl = columns.some(
  (column) => column.name === "image_url"
);

if (!hasImageUrl) {
  db.exec("ALTER TABLE products ADD COLUMN image_url TEXT");
  console.log("Image URL Column Added!");
}

// Customer orders table
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    email TEXT NOT NULL,
    house_number TEXT NOT NULL,
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    total_amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Add request_id column to existing orders table if missing
const orderColumns = db.prepare("PRAGMA table_info(orders)").all();

const hasRequestId = orderColumns.some(
  (column) => column.name === "request_id"
);

if (!hasRequestId) {
  db.exec("ALTER TABLE orders ADD COLUMN request_id TEXT");
  console.log("Order Request ID Column Added!");
}

// Prevent duplicate request IDs
db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_request_id
  ON orders(request_id)
  WHERE request_id IS NOT NULL
`);

// Products included in each order
db.exec(`
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER,
    product_name TEXT NOT NULL,
    brand TEXT NOT NULL,
    price REAL NOT NULL,
    size TEXT NOT NULL,
    color TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    FOREIGN KEY (order_id)
      REFERENCES orders(id)
      ON DELETE CASCADE
  )
`);

console.log("SuryaMart Database Connected!");
console.log("Products Table Ready!");
console.log("Orders Table Ready!");
console.log("Order Items Table Ready!");

module.exports = db;