const db = require("../config/db");
const bcrypt = require("bcryptjs");
const { enviarEmail } = require("../services/emailService");

// Create profesional
const createProfesional = (req, res) => {
  // Agregar codigo_registro a la desestructuración
  const { nombre, apellido, correo, telefono, especialidad, password, estado, codigo_registro } = req.body;

  if (!nombre || !apellido || !correo || !telefono || !password) {
    return res.status(400).json({ error: "Faltan campos requeridos" });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const profileEstado = estado || "aprobado";

    const query = `
    INSERT INTO usuarios 
    (nombre, apellido, correo, telefono, password, rol, especialidad, estado, debe_cambiar_password, codigo_registro)
    VALUES (?, ?, ?, ?, ?, 'profesional', ?, ?, TRUE, ?)
  `;

  db.query(
    query,
    [
      nombre,
      apellido,
      correo,
      telefono,
      hashedPassword,
      especialidad || null,
      profileEstado,
      codigo_registro || null,  // Si no se envía, se guarda NULL
    ],
    (err, result) => {
      if (err) {
        console.error("[ERROR] Database error:", err);

        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ error: "El correo ya está registrado" });
        }

        return res.status(500).json({ error: "Error al crear el profesional" });
      }

      // Enviar email si el profesional fue creado con estado aprobado
      if (profileEstado === "aprobado") {
        const asunto = "Tu cuenta ha sido creada - Cambio de Contraseña Requerido";
        const html = `
          <h2>Bienvenido ${nombre} ${apellido}</h2>
          <p>Tu cuenta como profesional ha sido creada exitosamente.</p>
          <p><strong>Por favor cambia tu contraseña en tu primer inicio de sesión.</strong></p>
          <p>
            <strong>Correo:</strong> ${correo}<br>
            <strong>Contraseña temporal:</strong> ${password}
          </p>
          <p>Por seguridad, te recomendamos cambiar esta contraseña inmediatamente.</p>
        `;
        enviarEmail(correo, asunto, html).catch(error => {
          console.error("[ERROR] Error enviando email de creación:", error);
        });
      }

      res.status(201).json({
        success: true,
        message: "Profesional creado exitosamente",
        id: result.insertId,
        estado: profileEstado
      });
    }
  );
};

// Get all profesionales
const getProfesionales = (req, res) => {
  const estado = req.query.estado;

  let query = "SELECT * FROM usuarios WHERE rol = 'profesional'";

  if (estado) {
    query += ` AND estado = '${estado}'`;
  }

  query += " ORDER BY nombre";

  db.query(query, (err, result) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Error en la base de datos" });
    }

    res.json(result);
  });
};

// Get profesional by ID
const getProfesionalById = (req, res) => {
  const { id } = req.params;

  const query = "SELECT * FROM usuarios WHERE id = ? AND rol = 'profesional'";

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Error en la base de datos" });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: "Profesional no encontrado" });
    }

    res.json({ success: true, profesional: result[0] });
  });
};

// Get profesionales by estado
const getProfesionalesByEstado = (req, res) => {
  const { estado } = req.params;

  const validEstados = ["pendiente", "aprobado", "rechazado"];

  if (!validEstados.includes(estado)) {
    return res.status(400).json({ error: "Estado inválido" });
  }

  const query = `
  SELECT * FROM usuarios 
  WHERE rol = 'profesional' AND estado = ?
  ORDER BY nombre
  `;

  db.query(query, [estado], (err, result) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Error en la base de datos" });
    }

    res.json({ success: true, profesionales: result });
  });
};

// Approve profesional
const approveProfesional = (req, res) => {
  const { id } = req.params;

  // Primero obtenemos los datos del profesional
  const getQuery = `SELECT nombre, apellido, correo FROM usuarios WHERE id = ? AND rol = 'profesional'`;
  
  db.query(getQuery, [id], (err, result) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Error en la base de datos" });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: "Profesional no encontrado" });
    }

    const profesional = result[0];

    const query = `
    UPDATE usuarios 
    SET estado = 'aprobado', motivo_rechazo = NULL
    WHERE id = ? AND rol = 'profesional'
    `;

    db.query(query, [id], (err, updateResult) => {
      if (err) {
        console.error("[ERROR] Database error:", err);
        return res.status(500).json({ error: "Error en la base de datos" });
      }

      if (updateResult.affectedRows === 0) {
        return res.status(404).json({ error: "Profesional no encontrado" });
      }

      // Enviar email de aprobación
      const asunto = "Tu solicitud ha sido APROBADA ✓";
      const html = `
        <h2>¡Felicidades ${profesional.nombre} ${profesional.apellido}!</h2>
        <p>Tu solicitud para ser profesional ha sido <strong>APROBADA</strong>.</p>
        <p>Ahora puedes acceder al sistema y comenzar a utilizar todas las funcionalidades disponibles para profesionales.</p>
        <p>Gracias por confiar en nosotros.</p>
      `;
      enviarEmail(profesional.correo, asunto, html).catch(error => {
        console.error("[ERROR] Error enviando email de aprobación:", error);
      });

      res.json({ success: true, message: "Profesional aprobado exitosamente" });
    });
  });
};

// Reject profesional
const rejectProfesional = (req, res) => {
  const { id } = req.params;
  const { motivo } = req.body;

  if (!motivo || motivo.trim() === "") {
    return res.status(400).json({ error: "El motivo del rechazo es requerido" });
  }

  // Primero obtenemos los datos del profesional
  const getQuery = `SELECT nombre, apellido, correo FROM usuarios WHERE id = ? AND rol = 'profesional'`;
  
  db.query(getQuery, [id], (err, result) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Error en la base de datos" });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: "Profesional no encontrado" });
    }

    const profesional = result[0];

    const query = `
    UPDATE usuarios 
    SET estado = 'rechazado', motivo_rechazo = ?
    WHERE id = ? AND rol = 'profesional'
    `;

    db.query(query, [motivo, id], (err, updateResult) => {
      if (err) {
        console.error("[ERROR] Database error:", err);
        return res.status(500).json({ error: "Error en la base de datos" });
      }

      if (updateResult.affectedRows === 0) {
        return res.status(404).json({ error: "Profesional no encontrado" });
      }

      // Enviar email de rechazo
      const asunto = "Actualización sobre tu solicitud";
      const html = `
        <h2>${profesional.nombre} ${profesional.apellido}</h2>
        <p>Hemos revisado tu solicitud y lamentablemente no ha sido aprobada en esta ocasión.</p>
        <h3>Motivo:</h3>
        <p>${motivo}</p>
        <p>Si tienes preguntas o deseas obtener más información, no dudes en contactarnos.</p>
      `;
      enviarEmail(profesional.correo, asunto, html).catch(error => {
        console.error("[ERROR] Error enviando email de rechazo:", error);
      });

      res.json({ success: true, message: "Profesional rechazado" });
    });
  });
};

// Update profesional
const updateProfesional = (req, res) => {
  const { id } = req.params;

  const { nombre, apellido, especialidad, telefono } = req.body;

  const query = `
  UPDATE usuarios SET
  nombre = ?,
  apellido = ?,
  especialidad = ?,
  telefono = ?
  WHERE id = ? AND rol = 'profesional'
  `;

  db.query(
    query,
    [nombre, apellido, especialidad, telefono, id],
    (err, result) => {
      if (err) {
        console.error("[ERROR] Database error:", err);
        return res.status(500).json({ error: "Error al actualizar el profesional" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Profesional no encontrado" });
      }

      res.json({
        success: true,
        message: "Profesional actualizado exitosamente"
      });
    }
  );
};

// Get montos for a profesional (calculated in real-time from pagos)
const getProfesionalMontos = (req, res) => {
  const { id } = req.params;

  // Calcular montos en tiempo real desde la tabla de pagos
  const query = `
    SELECT 
      COALESCE(SUM(CASE WHEN p.estado = 'pagado' THEN p.monto_pagado ELSE 0 END), 0) as total_ganado,
      COALESCE(SUM(CASE WHEN p.estado IN ('pendiente', 'comprobante_subido') THEN p.monto_pagado ELSE 0 END), 0) as total_pendiente
    FROM pagos p
    WHERE p.profesional_id = ?
  `;

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Error en la base de datos" });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: "Profesional no encontrado" });
    }

    res.json({
      success: true,
      total_ganado: result[0].total_ganado || 0,
      total_pendiente: result[0].total_pendiente || 0
    });
  });
};

module.exports = {
  getProfesionales,
  getProfesionalById,
  getProfesionalesByEstado,
  approveProfesional,
  rejectProfesional,
  updateProfesional,
  createProfesional,
  getProfesionalMontos
};
