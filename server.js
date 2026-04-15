const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

// Initialize upload directories
require("./init_uploads.js");

// Load .env file if it exists
try {
  require("dotenv").config();
} catch (error) {
  console.log("[WARNING] dotenv not loaded - using system environment variables");
}

// Initialize database tables
const db = require("./config/db");
const initializeTables = require("./init_tables.js");
initializeTables(db);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/defensas", require("./routes/defensas"));
app.use("/api/profesionales", require("./routes/profesionales"));
app.use("/api/pagos", require("./routes/pagos"));
app.use("/api/horarios", require("./routes/horarios"));
app.use("/api/postulaciones", require("./routes/postulacionesRoutes"));
app.use("/api/notificaciones", require("./routes/notificaciones"));
app.use("/api/whatsapp", require("./routes/whatsapp"));

// Historial route for defense history
const { getDefensasHistorial } = require("./controllers/postulacionesController");
app.get("/api/historial/:profesionalId", getDefensasHistorial);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("[ERROR]", err.message);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    status: err.status || 500
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[SUCCESS] Servidor corriendo en puerto ${PORT}`);
});
