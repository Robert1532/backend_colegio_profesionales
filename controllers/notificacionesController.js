const db = require("../config/db");

// Get all notifications for a user
const getNotificaciones = (req, res) => {
  const { usuarioId } = req.params;
  const { leida } = req.query;

  let query = `
    SELECT 
      n.*,
      d.estudiante,
      d.fecha,
      d.hora,
      p.nombre as profesional_nombre,
      p.apellido as profesional_apellido
    FROM notificaciones n
    LEFT JOIN defensas d ON n.defensa_id = d.id
    LEFT JOIN usuarios p ON n.profesional_id = p.id
    WHERE n.usuario_id = ?
  `;

  const params = [usuarioId];

  if (leida !== undefined) {
    query += ` AND n.leida = ?`;
    params.push(leida === 'true' ? 1 : 0);
  }

  query += ` ORDER BY n.created_at DESC LIMIT 100`;

  db.query(query, params, (err, result) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Error en la base de datos" });
    }
    res.json({ success: true, notificaciones: result });
  });
};

// Get unread notifications count
const getUnreadCount = (req, res) => {
  const { usuarioId } = req.params;

  const query = `
    SELECT COUNT(*) as count FROM notificaciones 
    WHERE usuario_id = ? AND leida = FALSE
  `;

  db.query(query, [usuarioId], (err, result) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Error en la base de datos" });
    }
    res.json({ success: true, count: result[0].count });
  });
};

// Mark notification as read
const markAsRead = (req, res) => {
  const { notificacionId } = req.params;

  const query = `UPDATE notificaciones SET leida = TRUE WHERE id = ?`;

  db.query(query, [notificacionId], (err, result) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Error en la base de datos" });
    }
    res.json({ success: true, message: "Notificación marcada como leída" });
  });
};

// Mark all notifications as read
const markAllAsRead = (req, res) => {
  const { usuarioId } = req.params;

  const query = `UPDATE notificaciones SET leida = TRUE WHERE usuario_id = ? AND leida = FALSE`;

  db.query(query, [usuarioId], (err, result) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Error en la base de datos" });
    }
    res.json({ 
      success: true, 
      message: "Notificaciones marcadas como leídas",
      affectedRows: result.affectedRows 
    });
  });
};

// Create notification
const createNotificacion = (req, res) => {
  const { usuario_id, tipo, defensa_id, profesional_id, titulo, mensaje, motivo } = req.body;

  if (!usuario_id || !tipo || !titulo || !mensaje) {
    return res.status(400).json({ error: "Campos requeridos: usuario_id, tipo, titulo, mensaje" });
  }

  const query = `
    INSERT INTO notificaciones 
    (usuario_id, tipo, defensa_id, profesional_id, titulo, mensaje, motivo)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [usuario_id, tipo, defensa_id || null, profesional_id || null, titulo, mensaje, motivo || null],
    (err, result) => {
      if (err) {
        console.error("[ERROR] Database error:", err);
        return res.status(500).json({ error: "Error al crear notificación" });
      }
      res.status(201).json({ success: true, id: result.insertId });
    }
  );
};

// Delete notification
const deleteNotificacion = (req, res) => {
  const { notificacionId } = req.params;

  const query = `DELETE FROM notificaciones WHERE id = ?`;

  db.query(query, [notificacionId], (err, result) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Error al eliminar notificación" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Notificación no encontrada" });
    }
    res.json({ success: true, message: "Notificación eliminada" });
  });
};

// Get admin notifications (new postulations and constancias)
const getAdminNotificaciones = (req, res) => {
  const { tipo } = req.query;

  let query = `
    SELECT 
      'postulacion' as tipo,
      pt.id,
      pt.defensa_id,
      pt.profesional_id,
      pt.estado,
      pt.created_at,
      u.nombre as profesional_nombre,
      u.apellido as profesional_apellido,
      u.especialidad,
      d.estudiante,
      d.tipo_documento,
      d.fecha,
      d.hora,
      NULL as constancia_asistencia
    FROM postulaciones pt
    LEFT JOIN usuarios u ON pt.profesional_id = u.id
    LEFT JOIN defensas d ON pt.defensa_id = d.id
    WHERE pt.estado = 'pendiente'
    
    UNION ALL
    
    SELECT 
      'constancia' as tipo,
      pt.id,
      pt.defensa_id,
      pt.profesional_id,
      pt.estado,
      pt.updated_at as created_at,
      u.nombre as profesional_nombre,
      u.apellido as profesional_apellido,
      u.especialidad,
      d.estudiante,
      d.tipo_documento,
      d.fecha,
      d.hora,
      pt.constancia_asistencia
    FROM postulaciones pt
    LEFT JOIN usuarios u ON pt.profesional_id = u.id
    LEFT JOIN defensas d ON pt.defensa_id = d.id
    WHERE pt.constancia_asistencia IS NOT NULL 
      AND pt.estado IN ('aceptado', 'aceptada')
  `;

  if (tipo && (tipo === 'postulacion' || tipo === 'constancia')) {
    query += ` AND tipo = '${tipo}'`;
  }

  query += ` ORDER BY created_at DESC LIMIT 50`;

  db.query(query, (err, result) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Error en la base de datos" });
    }
    res.json({ success: true, notificaciones: result });
  });
};

module.exports = {
  getNotificaciones,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotificacion,
  deleteNotificacion,
  getAdminNotificaciones
};
