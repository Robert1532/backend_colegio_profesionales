const db = require("../config/db");
const { notifyProfessionalsNewDefense } = require("../services/notificationService");

// Get all defensas (available defenses)
const getDefensas = (req, res) => {
  const query = `SELECT 
    id,
    estudiante,
    nombre_estudiante,
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
    created_at,
    updated_at
  FROM defensas 
  WHERE estado != 'finalizado'
  ORDER BY fecha DESC`;
  db.query(query, (err, result) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Error en la base de datos" });
    }
    // Format response to match Flutter model
    const formattedDefensas = result.map(row => ({
      id: row.id,
      nombreEstudiante: row.nombre_estudiante || row.estudiante,
      estudiante: row.estudiante,
      tipoDocumento: row.tipo_documento,
      universidad: row.universidad,
      universidadNombre: row.universidad_nombre,
      lugar: row.lugar,
      fecha: row.fecha,
      hora: row.hora,
      monto: parseFloat(row.monto_interno) || 0,
      monto_interno: parseFloat(row.monto_interno) || 0,
      maxProfesionales: row.max_profesionales,
      max_profesionales: row.max_profesionales,
      documentoAcademico: row.documento_academico,
      documento_academico: row.documento_academico,
      estado: row.estado,
      fechaCreacion: row.created_at,
      updatedAt: row.updated_at
    }));
    res.json({ success: true, defensas: formattedDefensas });
  });
};

// Get defensa by ID
const getDefensaById = (req, res) => {
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
};

// Get defensas by estado
const getDefensasByEstado = (req, res) => {
  const { estado } = req.params;

  const validEstados = ["pendiente", "finalizado"];

  if (!validEstados.includes(estado)) {
    return res.status(400).json({ error: "Estado inválido" });
  }

  const query = "SELECT * FROM defensas WHERE estado = ? ORDER BY fecha DESC";

  db.query(query, [estado], (err, result) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Error en la base de datos" });
    }

    res.json({ success: true, defensas: result });
  });
};

// Create defensa
const createDefensa = (req, res) => {
  const {
    estudiante,
    tipo_documento,
    universidad_nombre,
    lugar,
    fecha,
    hora,
    monto_interno,
    max_profesionales,
    documento_academico
  } = req.body;

  if (!estudiante || !tipo_documento || !fecha || !hora) {
    return res.status(400).json({
      error: "Estudiante, tipo_documento, fecha y hora son requeridos"
    });
  }

  let formattedHora = hora;

  if (hora) {
    if (!hora.match(/^\d{2}:\d{2}:\d{2}$/)) {
      const timeParts = hora.match(/(\d{1,2}):(\d{2})/);

      if (timeParts) {
        const h = String(parseInt(timeParts[1])).padStart(2, "0");
        const m = timeParts[2];

        formattedHora = `${h}:${m}:00`;
      }
    }
  }

  const query = `
  INSERT INTO defensas
  (estudiante, tipo_documento, universidad_nombre, lugar, fecha, hora, monto_interno, max_profesionales, documento_academico, estado)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')
  `;

  db.query(
    query,
    [
      estudiante,
      tipo_documento,
      universidad_nombre,
      lugar,
      fecha,
      formattedHora,
      monto_interno || 0,
      max_profesionales || 3,
      documento_academico || null
    ],
    (err, result) => {
      if (err) {
        console.error("[ERROR] Database error:", err);
        return res.status(500).json({
          error: "Error al crear la defensa: " + err.message
        });
      }

      const defensaId = result.insertId;

      // Notify all professionals about new defense
      notifyProfessionalsNewDefense(defensaId, tipo_documento, estudiante, fecha);

      res.status(201).json({
        success: true,
        id: defensaId,
        message: "Defensa creada exitosamente"
      });
    }
  );
};

// Update defensa
const updateDefensa = (req, res) => {
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

  const query = `
  UPDATE defensas SET
  estudiante = ?,
  tipo_documento = ?,
  universidad = ?,
  universidad_nombre = ?,
  lugar = ?,
  fecha = ?,
  hora = ?,
  monto_interno = ?,
  max_profesionales = ?,
  documento_academico = ?,
  estado = ?
  WHERE id = ?
  `;

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
};

// Delete defensa
const deleteDefensa = (req, res) => {
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
};

// Marcar defensa como completada
const completeDefensa = (req, res) => {
  const { defensaId } = req.params;
  
  const query = `UPDATE defensas SET estado = 'finalizado' WHERE id = ?`;
  
  db.query(query, [defensaId], (err, result) => {
    if (err) {
      console.error('[ERROR] Database error:', err);
      return res.status(500).json({ error: 'Error en la base de datos' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Defensa no encontrada' });
    }
    
    res.json({ success: true, message: 'Defensa completada exitosamente' });
  });
};

module.exports = {
  getDefensas,
  getDefensaById,
  getDefensasByEstado,
  createDefensa,
  updateDefensa,
  deleteDefensa,
  completeDefensa
};
