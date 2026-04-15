const db = require("../config/db");

// Get all horarios for a professional
const getHorarios = (req, res) => {
  const { profesionalId } = req.params;

  const query = "SELECT * FROM horarios WHERE usuario_id = ? ORDER BY dia";
  db.query(query, [profesionalId], (err, result) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Error en la base de datos" });
    }
    res.json({
      success: true,
      horarios: result,
    });
  });
};

// Create a new horario
const createHorario = (req, res) => {
  const { usuario_id, dia, hora_inicio, hora_fin } = req.body;

  if (!usuario_id || !dia || !hora_inicio || !hora_fin) {
    return res.status(400).json({
      error: "usuario_id, dia, hora_inicio y hora_fin son requeridos"
    });
  }

  const validDias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  if (!validDias.includes(dia)) {
    return res.status(400).json({ error: "Día inválido" });
  }

  // Check for duplicate schedule on the same day with overlapping times
  const checkQuery = `
    SELECT id FROM horarios 
    WHERE usuario_id = ? AND dia = ? AND hora_inicio = ? AND hora_fin = ?
    LIMIT 1
  `;
  
  db.query(checkQuery, [usuario_id, dia, hora_inicio, hora_fin], (err, checkResult) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Error al verificar horario" });
    }
    
    if (checkResult.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: "Ya tienes configurado un horario para " + dia + " en este turno" 
      });
    }

    const query =
      "INSERT INTO horarios (usuario_id, dia, hora_inicio, hora_fin) VALUES (?, ?, ?, ?)";
    db.query(
      query,
      [usuario_id, dia, hora_inicio, hora_fin],
      (err, result) => {
        if (err) {
          console.error("[ERROR] Database error:", err);
          return res.status(500).json({ error: "Error al crear el horario" });
        }
        res.status(201).json({
          success: true,
          id: result.insertId,
          message: "Horario creado exitosamente",
        });
      }
    );
  });
};

// Update a horario
const updateHorario = (req, res) => {
  const { id } = req.params;
  const { dia, hora_inicio, hora_fin } = req.body;

  if (!dia || !hora_inicio || !hora_fin) {
    return res.status(400).json({
      error: "dia, hora_inicio y hora_fin son requeridos"
    });
  }

  const query =
    "UPDATE horarios SET dia = ?, hora_inicio = ?, hora_fin = ? WHERE id = ?";
  db.query(query, [dia, hora_inicio, hora_fin, id], (err, result) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Error al actualizar el horario" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Horario no encontrado" });
    }
    res.json({
      success: true,
      message: "Horario actualizado exitosamente",
    });
  });
};

// Delete a horario
const deleteHorario = (req, res) => {
  const { id } = req.params;

  const query = "DELETE FROM horarios WHERE id = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Error al eliminar el horario" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Horario no encontrado" });
    }
    res.json({
      success: true,
      message: "Horario eliminado exitosamente",
    });
  });
};

module.exports = {
  getHorarios,
  createHorario,
  updateHorario,
  deleteHorario,
};
