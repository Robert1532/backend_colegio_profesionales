const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const db = require("../config/db");
const {
  getPostulacionesByDefensa,
} = require("../controllers/postulacionesController");
const {
  getDefensasCompletadas,
} = require("../controllers/defensasController");

// Configure multer to save academic documents to /uploads/documentos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/documentos"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];
    const extname = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(extname)) {
      return cb(null, true);
    }
    return cb(new Error(`Formato no permitido: ${extname}. Use PDF, DOC, DOCX, JPG o PNG`));
  },
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

// Upload academic document -> returns the saved filename
router.post("/upload-documento", (req, res, next) => {
  upload.single("documento")(req, res, (err) => {
    if (err) {
      console.error("[ERROR] Error subiendo documento:", err.message);
      return res.status(400).json({ success: false, error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No se recibió ningún archivo" });
    }
    console.log("[v0] Documento académico guardado:", req.file.filename);
    res.json({
      success: true,
      filename: req.file.filename,
      ruta: `/uploads/documentos/${req.file.filename}`,
      message: "Documento subido exitosamente",
    });
  });
});

// Get defensas completadas (historial) - must come before other GET routes
router.get("/historial/completadas", (req, res) => {
  getDefensasCompletadas(req, res);
});

// Get all defensas
router.get("/", (req, res) => {
  const query = "SELECT * FROM defensas ORDER BY fecha DESC";
  db.query(query, (err, result) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Error en la base de datos" });
    }
    res.json({ success: true, defensas: result });
  });
});

// Get postulantes for a defense (must come before /:id)
router.get("/:defensaId/postulantes", (req, res) => {
  getPostulacionesByDefensa(req, res);
});

// Get defensa by ID
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const query = "SELECT * FROM defensas WHERE id = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Error en la base de datos" });
    }
    if (result.length === 0) {
      return res.status(404).json({ error: "Defensa no encontrada" });
    }
    res.json({ success: true, defensa: result[0] });
  });
});

// Create defensa
router.post("/", (req, res) => {
  const {
    estudiante,
    tipo_documento,
    universidad,
    universidad_nombre,
    lugar,
    fecha,
    hora,
    monto_interno,
    max_profesionales,
    documento_academico
  } = req.body;

  // Validate input
  if (!estudiante || !tipo_documento || !fecha || !hora) {
    return res.status(400).json({
      error: "Estudiante, tipo_documento, fecha y hora son requeridos"
    });
  }

  const query = `INSERT INTO defensas 
    (estudiante, tipo_documento, universidad, universidad_nombre, lugar, fecha, hora, monto_interno, max_profesionales, documento_academico, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')`;

  db.query(
    query,
    [
      estudiante,
      tipo_documento,
      universidad,
      universidad_nombre,
      lugar,
      fecha,
      hora,
      monto_interno || 0,
      max_profesionales || 3,
      documento_academico || null
    ],
    (err, result) => {
      if (err) {
        console.error("[ERROR] Database error:", err);
        return res.status(500).json({ error: "Error al crear la defensa" });
      }
      res.status(201).json({
        success: true,
        id: result.insertId,
        message: "Defensa creada exitosamente"
      });
    }
  );
});

// Update defensa
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const {
    estudiante,
    tipo_documento,
    universidad,
    universidad_nombre,
    lugar,
    fecha,
    hora,
    monto_interno,
    max_profesionales,
    estado,
    documento_academico
  } = req.body;

  const query = `UPDATE defensas SET 
    estudiante = ?, tipo_documento = ?, universidad = ?, universidad_nombre = ?, 
    lugar = ?, fecha = ?, hora = ?, monto_interno = ?, max_profesionales = ?, documento_academico = ?, estado = ?
    WHERE id = ?`;

  db.query(
    query,
    [
      estudiante,
      tipo_documento,
      universidad,
      universidad_nombre,
      lugar,
      fecha,
      hora,
      monto_interno,
      max_profesionales,
      documento_academico,
      estado,
      id
    ],
    (err, result) => {
      if (err) {
        console.error("[ERROR] Database error:", err);
        return res.status(500).json({ error: "Error al actualizar la defensa" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Defensa no encontrada" });
      }
      res.json({
        success: true,
        message: "Defensa actualizada exitosamente"
      });
    }
  );
});

// Delete defensa
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM defensas WHERE id = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Error al eliminar la defensa" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Defensa no encontrada" });
    }
    res.json({
      success: true,
      message: "Defensa eliminada exitosamente"
    });
  });
});

module.exports = router;
