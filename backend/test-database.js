const db = require("./database");

const result = db.prepare("SELECT 1 AS test").get();

console.log("Database Test Result:", result);

if (result.test === 1) {
  console.log("Database Test Successful!");
}

db.close();