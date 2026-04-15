const mysql = require("mysql2");

// Load .env file if it exists
try {
  require("dotenv").config();
} catch (error) {
  // dotenv not loaded - using system environment variables
}

const db = mysql.createConnection({
  host: process.env.DB_HOST || "db45801.public.databaseasp.net",
  user: process.env.DB_USER || "db45801",
  password: process.env.DB_PASSWORD || "c%5N+7KhMx2#",
  database: process.env.DB_NAME || "db45801",
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
