const db = require("../config/db");
const emailService = require("../services/emailService");
const { notifyAdminNewPostulation } = require("../services/notificationService");

// Get all postulaciones
const getPostulaciones = (req, res) => {
  const query = "SELECT * FROM postulaciones";
  db.query(query, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({
      success: true,
      postulaciones: result,
    });
  });
};

// Get single postulacion by ID
const getPostulacionById = (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT 
      p.*,
      d.estudiante,
      d.tipo_documento,
      d.fecha,
      d.hora,
      d.lugar,
      d.universidad_nombre,
      u.nombre,
      u.apellido,
      u.especialidad
    FROM postulaciones p
    LEFT JOIN defensas d ON p.defensa_id = d.id
    LEFT JOIN usuarios u ON p.profesional_id = u.id
    WHERE p.id = ?
  `;
  
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: "Postulacion not found" });
    }
    
    const row = results[0];
    res.json({
      success: true,
      postulacion: {
        id: row.id,
        defensa_id: row.defensa_id,
        profesional_id: row.profesional_id,
        estado: row.estado,
        motivo_rechazo: row.motivo_rechazo,
        constancia_asistencia: row.constancia_asistencia,
        created_at: row.created_at,
        updated_at: row.updated_at,
        estudiante: row.estudiante,
        tipo_documento: row.tipo_documento,
        fecha: row.fecha,
        hora: row.hora,
        lugar: row.lugar,
        universidad_nombre: row.universidad_nombre,
        nombre_profesional: row.nombre,
        apellido_profesional: row.apellido,
        especialidad: row.especialidad
      }
    });
  });
};

// Get postulaciones for a professional
const getPostulacionesByProfesional = (req, res) => {
  const { profesionalId } = req.params;

  const query = `
    SELECT 
      p.id,
      p.defensa_id,
      p.profesional_id,
      p.estado,
      p.motivo_rechazo,
      p.constancia_asistencia,
      p.created_at,
      p.updated_at,
      d.id as defensa_id,
      d.estudiante,
      d.tipo_documento,
      d.fecha,
      d.hora,
      d.lugar,
      d.universidad,
      d.universidad_nombre,
      d.monto_interno,
      d.documento_academico,
      d.estado as defensa_estado,
      pg.monto_pagado,
      pg.comprobante as comprobante_pago,
      pg.estado as estado_pago
    FROM postulaciones p
    LEFT JOIN defensas d ON p.defensa_id = d.id
    LEFT JOIN pagos pg ON p.defensa_id = pg.defensa_id AND p.profesional_id = pg.profesional_id
    WHERE p.profesional_id = ?
    ORDER BY p.created_at DESC
  `;
  db.query(query, [profesionalId], (err, results) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    // Format postulaciones with defensa as nested object
    const postulaciones = results.map(row => ({
      id: row.id,
      defensa_id: row.defensa_id,
      profesional_id: row.profesional_id,
      estado: row.estado,
      motivoRechazo: row.motivo_rechazo,
      motivo_rechazo: row.motivo_rechazo,
      constanciaAsistencia: row.constancia_asistencia,
      constancia_asistencia: row.constancia_asistencia,
      montoPago: row.monto_pagado,
      monto_pago: row.monto_pagado,
      comprobantePago: row.comprobante_pago,
      comprobante_pago: row.comprobante_pago,
      estadoPago: row.estado_pago,
      estado_pago: row.estado_pago,
      created_at: row.created_at,
      updated_at: row.updated_at,
      defensa: row.defensa_id ? {
        id: row.defensa_id,
        estudiante: row.estudiante,
        tipoDocumento: row.tipo_documento,
        fecha: row.fecha,
        hora: row.hora,
        lugar: row.lugar,
        universidad: row.universidad,
        universidadNombre: row.universidad_nombre,
        monto: parseFloat(row.monto_interno) || 0,
        monto_interno: parseFloat(row.monto_interno) || 0,
        documentoAcademico: row.documento_academico,
        documento_academico: row.documento_academico,
        estado: row.defensa_estado
      } : null
    }));

    res.json({
      success: true,
      postulaciones: postulaciones,
    });
  });
};

// Get postulaciones for a defense
const getPostulacionesByDefensa = (req, res) => {
  const { defensaId } = req.params;

  const query = `
    SELECT 
      p.id,
      p.defensa_id,
      p.profesional_id,
      p.estado,
      p.motivo_rechazo,
      p.constancia_asistencia,
      p.created_at,
      p.updated_at,
      u.nombre,
      u.apellido,
      u.correo,
      u.especialidad,
      CONCAT(u.nombre, ' ', u.apellido) as nombre_profesional
    FROM postulaciones p
    LEFT JOIN usuarios u ON p.profesional_id = u.id
    WHERE p.defensa_id = ?
    ORDER BY p.created_at DESC
  `;
  db.query(query, [defensaId], (err, result) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    // Mapear respuesta para asegurar que los campos estén disponibles
    const postulaciones = result.map(row => ({
      id: row.id,
      defensa_id: row.defensa_id,
      profesional_id: row.profesional_id,
      estado: row.estado,
      motivoRechazo: row.motivo_rechazo,
      motivo_rechazo: row.motivo_rechazo,
      constanciaAsistencia: row.constancia_asistencia,
      constancia_asistencia: row.constancia_asistencia,
      created_at: row.created_at,
      updated_at: row.updated_at,
      nombre: row.nombre,
      apellido: row.apellido,
      correo: row.correo,
      especialidad: row.especialidad,
      nombre_profesional: row.nombre_profesional,
      nombreProfesional: row.nombre_profesional,
      especialidad_profesional: row.especialidad,
      especialidadProfesional: row.especialidad
    }));
    
    res.json({
      success: true,
      postulaciones: postulaciones,
    });
  });
};

// Create a new postulacion
const createPostulacion = (req, res) => {
  const { profesional_id, defensa_id } = req.body;

  if (!profesional_id || !defensa_id) {
    return res
      .status(400)
      .json({ error: "Missing required fields" });
  }

  // Check if already postulated
  const checkQuery =
    "SELECT * FROM postulaciones WHERE profesional_id = ? AND defensa_id = ?";
  db.query(
    checkQuery,
    [profesional_id, defensa_id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }

      if (result.length > 0) {
        return res
          .status(400)
          .json({ error: "Already postulated to this defense" });
      }

      // Create postulacion
      const insertQuery =
        "INSERT INTO postulaciones (profesional_id, defensa_id, estado) VALUES (?, ?, 'pendiente')";
      db.query(
        insertQuery,
        [profesional_id, defensa_id],
        (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error" });
          }

          // Get defensa info and notify admin
          const defensaQuery = "SELECT estudiante, tipo_documento, fecha FROM defensas WHERE id = ?";
          db.query(defensaQuery, [defensa_id], (err, defensas) => {
            if (!err && defensas.length > 0) {
              const defensa = defensas[0];
              notifyAdminNewPostulation(
                defensa_id,
                profesional_id,
                defensa.estudiante,
                defensa.tipo_documento,
                defensa.fecha
              );
            }
          });

          res.status(201).json({
            success: true,
            id: result.insertId,
            message: "Postulation created successfully",
          });
        }
      );
    }
  );
};

// Update postulacion status
const updatePostulacion = (req, res) => {
  const { id } = req.params;
  const { estado, motivo } = req.body;

  if (!estado) {
    return res.status(400).json({ error: "Estado is required" });
  }

  // Obtener información de la postulación, profesional y defensa
  const query = `
    SELECT 
      p.id,
      p.profesional_id,
      p.defensa_id,
      p.estado as estado_anterior,
      u.nombre,
      u.apellido,
      u.correo,
      d.estudiante,
      d.tipo_documento
    FROM postulaciones p
    LEFT JOIN usuarios u ON p.profesional_id = u.id
    LEFT JOIN defensas d ON p.defensa_id = d.id
    WHERE p.id = ?
  `;
  
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Postulation not found" });
    }
    
    const postulacion = result[0];
    const nombreCompleto = `${postulacion.nombre} ${postulacion.apellido}`;
    const nombreDefensa = `${postulacion.tipo_documento} de ${postulacion.estudiante}`;
    const correoProf = postulacion.correo;
    
    // Actualizar estado y motivo_rechazo si existe
    let updateQuery = "UPDATE postulaciones SET estado = ?";
    let updateParams = [estado];
    
    if (motivo && motivo.trim() !== "") {
      updateQuery += ", motivo_rechazo = ?";
      updateParams.push(motivo);
    }
    
    updateQuery += " WHERE id = ?";
    updateParams.push(id);
    
    db.query(updateQuery, updateParams, async (updateErr, updateResult) => {
      if (updateErr) {
        console.error("[ERROR] Update error:", updateErr);
        return res.status(500).json({ error: "Database error" });
      }
      
      // Enviar correo según el estado
      try {
        if (estado === 'aceptado') {
          await emailService.enviarCorreoAceptacion(
            correoProf,
            nombreCompleto,
            nombreDefensa,
            postulacion.estudiante
          );
        } else if (estado === 'rechazado') {
          await emailService.enviarCorreoRechazo(
            correoProf,
            nombreCompleto,
            nombreDefensa,
            postulacion.estudiante,
            motivo || 'Sin especificar'
          );
        }
      } catch (emailErr) {
        console.error("[WARNING] Error sending email:", emailErr);
        // No fallar la actualización si hay error en email
      }
      
      res.json({
        success: true,
        message: "Postulation updated successfully",
      });
    });
  });
};

// Delete postulacion
const deletePostulacion = (req, res) => {
  const { id } = req.params;

  const query = "DELETE FROM postulaciones WHERE id = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({
      success: true,
      message: "Postulation deleted successfully",
    });
  });
};

// Upload attendance certificate (constancia de asistencia)
const uploadAttendanceCertificate = (req, res) => {
  const { id } = req.params;
  const { constancia_asistencia } = req.body;

  if (!id || !constancia_asistencia) {
    return res.status(400).json({
      error: "Postulation ID and constancia_asistencia are required"
    });
  }

  // Store full path for file access
  const constanciaRuta = `/uploads/constancias/${constancia_asistencia}`;
  console.log("[v0] Storing constancia path:", constanciaRuta);

  const query = "UPDATE postulaciones SET constancia_asistencia = ? WHERE id = ?";
  db.query(query, [constanciaRuta, id], (err, result) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ 
        success: false,
        error: "Error updating postulation",
        details: err.message 
      });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Postulation not found" 
      });
    }
    res.status(200).json({
      success: true,
      message: "Attendance certificate uploaded successfully",
      constancia_path: constanciaRuta,
      constancia_asistencia: constanciaRuta,
      postulacion_id: id
    });
  });
};

// Helper function to fix broken/fragmented file paths
const fixFilePathInPost = (filePath) => {
  if (!filePath) return null;
  
  const pathStr = filePath.toString().trim();
  
  // Already correct format
  if (pathStr.startsWith('/uploads/')) {
    return pathStr;
  }
  
  // Extract filename from corrupted path
  const parts = pathStr.split('/').filter(p => p);
  const filename = parts[parts.length - 1];
  
  if (!filename || filename.length < 5) {
    return null;
  }
  
  // Determine folder
  const ext = filename.split('.').pop().toLowerCase();
  
  if (ext === 'pdf' || ext === 'doc' || ext === 'docx') {
    return `/uploads/comprobantes/${filename}`;
  } else if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') {
    return `/uploads/comprobantes/${filename}`;
  }
  
  return `/uploads/${filename}`;
};

// Get defense history for a professional (ONLY completed/finalized defenses with payments)
const getDefensasHistorial = (req, res) => {
  const { profesionalId } = req.params;

  const query = `
    SELECT 
      p.id,
      p.defensa_id,
      p.profesional_id,
      p.estado,
      p.constancia_asistencia,
      p.created_at,
      p.updated_at,
      d.id as defensa_id,
      d.estudiante,
      d.tipo_documento,
      d.fecha,
      d.hora,
      d.lugar,
      d.universidad,
      d.universidad_nombre,
      d.monto_interno,
      d.documento_academico,
      d.estado as defensa_estado,
      pg.monto_pagado,
      pg.comprobante,
      pg.estado as estado_pago
    FROM postulaciones p
    INNER JOIN defensas d ON p.defensa_id = d.id
    LEFT JOIN pagos pg ON p.defensa_id = pg.defensa_id AND p.profesional_id = pg.profesional_id
    WHERE p.profesional_id = ? 
      AND p.estado IN ('aceptado', 'aceptada')
      AND LOWER(d.estado) IN ('finalizado', 'finalizada')
    ORDER BY d.fecha DESC
  `;
  
  db.query(query, [profesionalId], (err, results) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    // Format historial with all necessary details and fix file paths
    const historial = results.map(row => ({
      id: row.id,
      defensa_id: row.defensa_id,
      profesional_id: row.profesional_id,
      estado: row.estado,
      constancia_asistencia: fixFilePathInPost(row.constancia_asistencia),
      created_at: row.created_at,
      updated_at: row.updated_at,
      estudiante: row.estudiante,
      tipo_documento: row.tipo_documento,
      fecha: row.fecha,
      hora: row.hora,
      lugar: row.lugar,
      universidad: row.universidad,
      universidad_nombre: row.universidad_nombre,
      monto: parseFloat(row.monto_interno) || 0,
      monto_interno: parseFloat(row.monto_interno) || 0,
      documento_academico: row.documento_academico,
      defensa_estado: row.defensa_estado,
      monto_pagado: row.monto_pagado ? parseFloat(row.monto_pagado) : null,
      comprobante: fixFilePathInPost(row.comprobante),
      estado_pago: row.estado_pago,
      pagado: row.estado_pago === 'pagado' || row.comprobante !== null
    }));

    res.json({
      success: true,
      historial: historial,
    });
  });
};

module.exports = {
  getPostulaciones,
  getPostulacionById,
  getPostulacionesByProfesional,
  getPostulacionesByDefensa,
  createPostulacion,
  updatePostulacion,
  deletePostulacion,
  uploadAttendanceCertificate,
  getDefensasHistorial,
};
