const db = require("../config/db");

// Generate WhatsApp reminder message
const generateReminderMessage = (defensaData, diasRestantes) => {
  const fecha = new Date(defensaData.fecha).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const mensaje = `📋 *Recordatorio de Defensa*

Estimado profesional,

Recordamos que tienes una defensa programada:

📅 *Fecha:* ${fecha}
⏰ *Hora:* ${defensaData.hora}
👤 *Estudiante:* ${defensaData.estudiante}
📄 *Tipo:* ${defensaData.tipo_documento}
📍 *Lugar:* ${defensaData.lugar || 'Por confirmar'}

⏳ *Falta(n)* ${diasRestantes} día(s) para tu defensa.

Por favor, asegúrate de asistir puntualmente.

¡Gracias!`;

  return mensaje;
};

// Get reminder for a specific professional
const getReminder = (req, res) => {
  const { defensaId, profesionalId } = req.params;

  const query = `
    SELECT 
      d.id,
      d.estudiante,
      d.tipo_documento,
      d.fecha,
      d.hora,
      d.lugar,
      u.nombre,
      u.apellido,
      u.telefono,
      DATEDIFF(d.fecha, CURDATE()) as dias_restantes
    FROM defensas d
    INNER JOIN postulaciones p ON d.id = p.defensa_id AND p.profesional_id = ?
    INNER JOIN usuarios u ON p.profesional_id = u.id
    WHERE d.id = ? AND p.estado IN ('aceptado', 'aceptada')
  `;

  db.query(query, [profesionalId, defensaId], (err, result) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Error en la base de datos" });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: "Defensa o profesional no encontrado" });
    }

    const defensa = result[0];
    const diasRestantes = defensa.dias_restantes;

    if (diasRestantes < 0) {
      return res.status(400).json({ error: "La defensa ya pasó" });
    }

    const mensaje = generateReminderMessage(defensa, diasRestantes);
    const whatsappUrl = `https://wa.me/${defensa.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`;

    res.json({
      success: true,
      defensa: {
        id: defensa.id,
        estudiante: defensa.estudiante,
        tipo_documento: defensa.tipo_documento,
        fecha: defensa.fecha,
        hora: defensa.hora,
        lugar: defensa.lugar,
        diasRestantes: diasRestantes
      },
      profesional: {
        nombre: defensa.nombre,
        apellido: defensa.apellido,
        telefono: defensa.telefono
      },
      mensaje: mensaje,
      whatsappUrl: whatsappUrl
    });
  });
};

// Get all reminders (for admin to send)
const getAllReminders = (req, res) => {
  const query = `
    SELECT 
      d.id as defensa_id,
      d.estudiante,
      d.tipo_documento,
      d.fecha,
      d.hora,
      d.lugar,
      p.profesional_id,
      u.nombre,
      u.apellido,
      u.telefono,
      DATEDIFF(d.fecha, CURDATE()) as dias_restantes
    FROM defensas d
    INNER JOIN postulaciones p ON d.id = p.defensa_id
    INNER JOIN usuarios u ON p.profesional_id = u.id
    WHERE p.estado IN ('aceptado', 'aceptada')
      AND d.fecha > CURDATE()
      AND d.estado NOT IN ('finalizado', 'cancelado')
    ORDER BY d.fecha ASC
  `;

  db.query(query, (err, result) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Error en la base de datos" });
    }

    const reminders = result.map(row => ({
      defensa: {
        id: row.defensa_id,
        estudiante: row.estudiante,
        tipo_documento: row.tipo_documento,
        fecha: row.fecha,
        hora: row.hora,
        lugar: row.lugar,
        diasRestantes: row.dias_restantes
      },
      profesional: {
        id: row.profesional_id,
        nombre: row.nombre,
        apellido: row.apellido,
        telefono: row.telefono
      },
      mensaje: generateReminderMessage(row, row.dias_restantes),
      whatsappUrl: `https://wa.me/${row.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(generateReminderMessage(row, row.dias_restantes))}`
    }));

    res.json({
      success: true,
      reminders: reminders,
      total: reminders.length
    });
  });
};

// Record that admin sent reminder
const recordReminderSent = (req, res) => {
  const { defensaId, profesionalId } = req.body;

  if (!defensaId || !profesionalId) {
    return res.status(400).json({ error: "defensaId y profesionalId son requeridos" });
  }

  // Create a notification for the professional
  const notificacionQuery = `
    INSERT INTO notificaciones 
    (usuario_id, tipo, defensa_id, titulo, mensaje)
    SELECT 
      ?,
      'admin_postulacion',
      ?,
      'Recordatorio de Defensa',
      CONCAT('El administrador te ha enviado un recordatorio por WhatsApp sobre tu defensa del ', DATE_FORMAT(d.fecha, '%d/%m/%Y'), ' a las ', d.hora)
    FROM defensas d
    WHERE d.id = ?
  `;

  db.query(notificacionQuery, [profesionalId, defensaId, defensaId], (err, result) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Error al registrar recordatorio" });
    }

    res.json({
      success: true,
      message: "Recordatorio registrado exitosamente"
    });
  });
};

module.exports = {
  getReminder,
  getAllReminders,
  recordReminderSent
};
