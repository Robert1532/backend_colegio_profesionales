const db = require("../config/db");
const { notifyProfessionalPaymentReceived } = require("../services/notificationService");

// Verify if pago exists
const verificarPago = (req, res) => {
  const { profesional_id, defensa_id } = req.query;

  if (!profesional_id || !defensa_id) {
    return res.status(400).json({
      existe: false,
      pago: null,
    });
  }

  const query = `SELECT id, estado, monto_pagado, comprobante FROM pagos 
    WHERE profesional_id = ? AND defensa_id = ?`;

  db.query(query, [profesional_id, defensa_id], (err, result) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(200).json({
        existe: false,
        pago: null,
      });
    }

    const existe = result && result.length > 0;
    res.status(200).json({
      existe: existe,
      pago: existe ? result[0] : null,
    });
  });
};

// Get all pagos
const getPagos = (req, res) => {
  const query = `SELECT p.*, u.nombre, u.apellido, d.estudiante FROM pagos p
    LEFT JOIN usuarios u ON p.profesional_id = u.id
    LEFT JOIN defensas d ON p.defensa_id = d.id
    ORDER BY p.created_at DESC`;
  
  db.query(query, (err, result) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Error en la base de datos" });
    }
    res.json({ success: true, pagos: result });
  });
};

// Get pago by ID
const getPagoById = (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT 
      p.*,
      u.nombre,
      u.apellido,
      u.especialidad,
      d.estudiante,
      d.fecha,
      d.tipo_documento,
      d.lugar,
      d.universidad_nombre
    FROM pagos p
    LEFT JOIN usuarios u ON p.profesional_id = u.id
    LEFT JOIN defensas d ON p.defensa_id = d.id
    WHERE p.id = ?
  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Error en la base de datos" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: "Pago no encontrado" });
    }
    
    res.json({ 
      success: true, 
      pago: results[0] 
    });
  });
};

// Get pagos by profesional
const getPagosByProfesional = (req, res) => {
  const { profesionalId } = req.params;
  
  const query = `SELECT p.*, d.estudiante, d.fecha FROM pagos p
    LEFT JOIN defensas d ON p.defensa_id = d.id
    WHERE p.profesional_id = ?
    ORDER BY p.created_at DESC`;

  db.query(query, [profesionalId], (err, result) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Error en la base de datos" });
    }
    res.json({ success: true, pagos: result });
  });
};

// Get pagos by estado
const getPagosByEstado = (req, res) => {
  const { estado } = req.params;
  const validEstados = ["pendiente", "pagado", "rechazado"];
  
  if (!validEstados.includes(estado)) {
    return res.status(400).json({ error: "Estado inválido" });
  }

  const query = `SELECT p.*, u.nombre, u.apellido, d.estudiante FROM pagos p
    LEFT JOIN usuarios u ON p.profesional_id = u.id
    LEFT JOIN defensas d ON p.defensa_id = d.id
    WHERE p.estado = ?
    ORDER BY p.created_at DESC`;

  db.query(query, [estado], (err, result) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Error en la base de datos" });
    }
    res.json({ success: true, pagos: result });
  });
};

// Create pago
const createPago = (req, res) => {
  const { profesional_id, defensa_id, monto_pagado, comprobante } = req.body;

  if (!profesional_id || !defensa_id || !monto_pagado) {
    return res.status(400).json({
      error: "profesional_id, defensa_id y monto_pagado son requeridos"
    });
  }

  // First check if pago already exists for this combination
  const checkQuery = `SELECT id FROM pagos WHERE profesional_id = ? AND defensa_id = ?`;
  db.query(checkQuery, [profesional_id, defensa_id], (checkErr, checkResult) => {
    if (checkErr) {
      console.error("[ERROR] Database error:", checkErr);
      return res.status(500).json({ error: "Error al verificar pago" });
    }

    if (checkResult && checkResult.length > 0) {
      return res.status(409).json({
        error: "Ya existe un pago para esta defensa",
        pagoId: checkResult[0].id
      });
    }

    // If comprobante is provided, set estado to 'pagado', otherwise 'pendiente'
    const estado = comprobante ? 'pagado' : 'pendiente';

    const query = `INSERT INTO pagos (profesional_id, defensa_id, monto_pagado, comprobante, estado, fecha_pago)
      VALUES (?, ?, ?, ?, ?, ${comprobante ? 'CURDATE()' : 'NULL'})`;

    db.query(
      query,
      [profesional_id, defensa_id, monto_pagado, comprobante || null, estado],
      (err, result) => {
        if (err) {
          console.error("[ERROR] Database error:", err);
          return res.status(500).json({ error: "Error al crear el pago" });
        }
        res.status(201).json({
          success: true,
          id: result.insertId,
          message: "Pago creado exitosamente",
          estado: estado
        });
      }
    );
  });
};

// Update pago status
const updatePagoStatus = (req, res) => {
  const { id } = req.params;
  const { estado, comprobante } = req.body;

  if (!estado) {
    return res.status(400).json({ error: "Estado es requerido" });
  }

  const validEstados = ["pendiente", "pagado", "rechazado"];
  if (!validEstados.includes(estado)) {
    return res.status(400).json({ error: "Estado inválido" });
  }

  const query = `UPDATE pagos SET estado = ?, comprobante = ?, fecha_pago = CURDATE() WHERE id = ?`;

      db.query(query, [estado, comprobante || null, id], (err, result) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Error al actualizar el pago" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Pago no encontrado" });
    }

    // Notify professional if payment was marked as pagado/aprobado
    if (estado === 'pagado' || estado === 'aprobado') {
      const pagoQuery = "SELECT profesional_id, defensa_id FROM pagos WHERE id = ?";
      db.query(pagoQuery, [id], (err, pagos) => {
        if (!err && pagos.length > 0) {
          const pago = pagos[0];
          notifyProfessionalPaymentReceived(
            pago.profesional_id,
            pago.defensa_id,
            'tu pago'
          );
        }
      });
    }

    res.json({ success: true, message: "Pago actualizado exitosamente" });
  });
};

// Delete pago
const deletePago = (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM pagos WHERE id = ?";

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Error al eliminar el pago" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Pago no encontrado" });
    }
    res.json({ success: true, message: "Pago eliminado exitosamente" });
  });
};

// Upload comprobante for a pago
const uploadComprobante = (req, res) => {
  const { id } = req.params;
  
  console.log("[v0] Upload request for pago ID:", id);
  console.log("[v0] File received:", req.file ? req.file.filename : "NO FILE");

  if (!req.file) {
    console.log("[v0] No file provided in request");
    return res.status(400).json({ error: "Archivo requerido", success: false });
  }

  const comprobanteRuta = `/uploads/comprobantes/${req.file.filename}`;
  console.log("[v0] Comprobante ruta:", comprobanteRuta);

  const query = `UPDATE pagos 
    SET comprobante = ?, estado = 'pagado', fecha_pago = CURDATE() 
    WHERE id = ?`;

  db.query(query, [comprobanteRuta, id], (err, result) => {
    if (err) {
      console.error("[ERROR] Database error in uploadComprobante:", err);
      return res.status(500).json({ 
        error: "Error al actualizar el pago", 
        success: false,
        details: err.message 
      });
    }

    if (result.affectedRows === 0) {
      console.log("[v0] Pago ID not found:", id);
      return res.status(404).json({ 
        error: "Pago no encontrado", 
        success: false 
      });
    }

    // Notify professional about payment
    const pagoQuery = "SELECT profesional_id, defensa_id FROM pagos WHERE id = ?";
    db.query(pagoQuery, [id], (err, pagos) => {
      if (!err && pagos.length > 0) {
        const pago = pagos[0];
        notifyProfessionalPaymentReceived(
          pago.profesional_id,
          pago.defensa_id,
          'Bs. ' + (req.body.monto || 'X')
        );
      }
    });

    console.log("[v0] Comprobante uploaded successfully for pago:", id);
    res.status(200).json({
      success: true,
      message: "Comprobante subido exitosamente",
      comprobante: comprobanteRuta,
      pagoId: id
    });
  });
};

// Get pending payments for completed defenses
const getCompletedDefensePayments = (req, res) => {
  const query = `
    SELECT 
      COALESCE(p.id, 0) as id,
      pt.profesional_id,
      d.id as defensa_id,
      d.monto_interno as monto_pagado,
      p.comprobante,
      COALESCE(p.estado, 'pendiente') as estado,
      COALESCE(p.created_at, NOW()) as created_at,
      d.id as def_id,
      d.estudiante,
      d.fecha,
      d.hora,
      d.tipo_documento,
      d.monto_interno,
      d.estado as defensa_estado,
      u.id as prof_id,
      u.nombre,
      u.apellido,
      u.correo,
      u.especialidad,
      CONCAT(u.nombre, ' ', u.apellido) as nombre_profesional,
      pt.constancia_asistencia
    FROM defensas d
    INNER JOIN postulaciones pt ON d.id = pt.defensa_id AND pt.estado IN ('aceptado', 'aceptada')
    INNER JOIN usuarios u ON pt.profesional_id = u.id
    LEFT JOIN pagos p ON d.id = p.defensa_id AND pt.profesional_id = p.profesional_id
    WHERE d.estado = 'finalizado' OR d.fecha_finalizacion IS NOT NULL
    ORDER BY d.fecha DESC, u.nombre ASC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Error en la base de datos" });
    }

    // Format results and filter - only show PENDING payments
    const formattedPayments = results
      .filter(row => row.id === 0 || row.estado === 'pendiente') // Show either no pago (id=0) or pending payments
      .map(row => ({
        id: row.id,
        profesional_id: row.profesional_id,
        defensa_id: row.defensa_id,
        monto_pagado: row.monto_pagado,
        comprobante: row.comprobante,
        estado: row.estado,
        constancia_asistencia: row.constancia_asistencia,
        created_at: row.created_at,
        defensa: {
          id: row.def_id,
          estudiante: row.estudiante,
          fecha: row.fecha,
          hora: row.hora,
          tipo_documento: row.tipo_documento,
          monto_interno: row.monto_interno,
          estado: row.defensa_estado,
        },
        profesional: {
          id: row.prof_id,
          nombre: row.nombre,
          apellido: row.apellido,
          correo: row.correo,
          especialidad: row.especialidad,
          nombre_completo: row.nombre_profesional,
        },
      }));

    res.json({
      success: true,
      pagos: formattedPayments,
    });
  });
};

module.exports = {
  getPagos,
  getPagoById,
  getPagosByProfesional,
  getPagosByEstado,
  createPago,
  updatePagoStatus,
  deletePago,
  uploadComprobante,
  getCompletedDefensePayments,
  verificarPago
  };
