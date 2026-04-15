const express = require("express");
const router = express.Router();
const {
  getHorarios,
  createHorario,
  updateHorario,
  deleteHorario,
} = require("../controllers/horariosController");

router.get("/:profesionalId", getHorarios);
router.post("/", createHorario);
router.put("/:id", updateHorario);
router.delete("/:id", deleteHorario);

module.exports = router;
