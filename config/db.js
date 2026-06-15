const mysql = require("mysql2");

// Load .env file if it exists
try {
  require("dotenv").config();
} catch (error) {
  // dotenv not loaded - using system environment variables
}

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "baa123456789",
  database: process.env.DB_NAME || "defaultdb",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.connect((err) => {
  if (err) {
    console.error("[ERROR] MySQL connection failed:", err.message);
    console.error("Retrying connection in 5 seconds...");
    setTimeout(() => {
      db.connect((retryErr) => {
        if (retryErr) {
          console.error("[ERROR] MySQL reconnection failed:", retryErr.message);
        } else {
          console.log("[SUCCESS] MySQL conectado");
        }
      });
    }, 5000);
  } else {
    console.log("[SUCCESS] MySQL conectado");
  }
});

module.exports = db;
