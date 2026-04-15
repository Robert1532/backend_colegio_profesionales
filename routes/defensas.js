const express = require("express");
const router = express.Router();
const db = require("../config/db");
const {
  getPostulacionesByDefensa,
} = require("../controllers/postulacionesController");

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
