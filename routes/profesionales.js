const express = require("express");
const router = express.Router();
const {
  getProfesionales,
  getProfesionalById,
  getProfesionalesByEstado,
  approveProfesional,
  rejectProfesional,
  updateProfesional,
  createProfesional,
  getProfesionalMontos
} = require("../controllers/profesionalesController");

// Create profesional
router.post("/", createProfesional);

// Get all profesionales
router.get("/", getProfesionales);

// Get profesionales by estado
router.get("/estado/:estado", getProfesionalesByEstado);

// Get profesional by ID
router.get("/:id", getProfesionalById);

// Get profesional montos (total ganado y pendiente)
router.get("/:id/montos", getProfesionalMontos);

// Update profesional
router.put("/:id", updateProfesional);

// Approve profesional
router.patch("/:id/approve", approveProfesional);

// Reject profesional
router.patch("/:id/reject", rejectProfesional);

module.exports = router;
