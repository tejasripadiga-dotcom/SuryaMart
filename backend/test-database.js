const { pool, initializeDatabase } = require("./database");

async function testDatabase() {
  try {
    // Initialize database tables
    await initializeDatabase();

    // Test PostgreSQL connection
    const result = await pool.query("SELECT 1 AS test");

    console.log("Database Test Result:", result.rows[0]);

    if (Number(result.rows[0].test) === 1) {
      console.log("PostgreSQL Database Test Successful!");
    }
  } catch (error) {
    console.error("Database Test Failed:", error);
  } finally {
    await pool.end();
  }
}

testDatabase();