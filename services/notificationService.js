const db = require("../config/db");

const createNotification = (usuarioId, tipo, defensaId, profesionalId, titulo, mensaje) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO notificaciones 
      (usuario_id, tipo, defensa_id, profesional_id, titulo, mensaje, leida, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, NOW(), NOW())
    `;
    const values = [usuarioId, tipo, defensaId, profesionalId, titulo, mensaje];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error("[ERROR] Failed to create notification:", err.message);
        reject(err);
      } else {
        console.log("[SUCCESS] Notification created with ID:", result.insertId);
        resolve(result);
      }
    });
  });
};

const notifyProfessionalsNewDefense = (defensaId, tipo_documento, estudiante, fecha) => {
  const profsQuery = "SELECT id FROM usuarios WHERE rol = 'profesional' AND estado = 'aprobado'";

  db.query(profsQuery, (err, professionals) => {
    if (err) {
      console.error("[ERROR] Failed to fetch professionals:", err);
      return;
    }
    if (!professionals || professionals.length === 0) {
      console.log("[WARNING] No approved professionals found");
      return;
    }

    console.log(`[INFO] Notifying ${professionals.length} professionals about new defense`);

    const titulo = "Nueva defensa disponible";
    const mensaje = `Se ha creado una nueva ${tipo_documento} para ${estudiante} el ${fecha}`;

    professionals.forEach(prof => {
      createNotification(
        prof.id,
        'defensa_creada',
        defensaId,
        null,
        titulo,
        mensaje
      ).catch(err => console.error(`[ERROR] Failed to notify professional ${prof.id}:`, err.message));
    });
  });
};

const notifyAdminNewPostulation = (defensaId, profesionalId, estudiante, tipo_documento, fecha) => {
  const adminId = 1; // Ajusta según tu admin real

  const titulo = "Nueva postulación recibida";
  const mensaje = `Se ha recibido una nueva postulación para ${tipo_documento} de ${estudiante} el ${fecha}`;

  createNotification(
    adminId,
    'postulacion',
    defensaId,
    profesionalId,
    titulo,
    mensaje
  ).catch(err => console.error("[ERROR] Failed to notify admin about postulation:", err.message));
};

const notifyProfessionalPaymentReceived = (profesionalId, defensaId, montoString) => {
  const titulo = "Pago recibido";
  const mensaje = `Se ha procesado tu pago exitosamente por ${montoString}`;

  createNotification(
    profesionalId,
    'pago_recibido',
    defensaId,
    profesionalId,
    titulo,
    mensaje
  ).catch(err => console.error("[ERROR] Failed to notify professional about payment:", err.message));
};

// Nueva función: notificar al profesional cuando su postulación es aceptada
const notifyProfessionalPostulationAccepted = (profesionalId, defensaId, estudiante) => {
  const titulo = "Postulación aceptada";
  const mensaje = `Tu postulación para la defensa de ${estudiante} ha sido aceptada.`;

  createNotification(
    profesionalId,
    'postulacion_aceptada',
    defensaId,
    profesionalId,
    titulo,
    mensaje
  ).catch(err => console.error("[ERROR] Failed to notify professional about acceptance:", err.message));
};

// Nueva función: notificar al profesional cuando se crea una postulación (él mismo o admin)
const notifyProfessionalPostulationCreated = (profesionalId, defensaId, estudiante) => {
  const titulo = "Postulación registrada";
  const mensaje = `Te has postulado a la defensa de ${estudiante}.`;

  createNotification(
    profesionalId,
    'postulacion_creada',
    defensaId,
    profesionalId,
    titulo,
    mensaje
  ).catch(err => console.error("[ERROR] Failed to notify professional about postulation creation:", err.message));
};

module.exports = {
  createNotification,
  notifyProfessionalsNewDefense,
  notifyAdminNewPostulation,
  notifyProfessionalPaymentReceived,
  notifyProfessionalPostulationAccepted,
  notifyProfessionalPostulationCreated
};