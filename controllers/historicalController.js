const db = require("../config/db");

// Helper function to fix broken/fragmented file paths
const fixFilePath = (filePath) => {
  if (!filePath) return null;
  
  const pathStr = filePath.toString().trim();
  
  // Already correct format
  if (pathStr.startsWith('/uploads/')) {
    return pathStr;
  }
  
  // Extract filename from corrupted path
  // e.g., /1/48/2/50db-29f625213.png -> 50db-29f625213.png
  const parts = pathStr.split('/').filter(p => p);
  const filename = parts[parts.length - 1];
  
  if (!filename || filename.length < 5) {
    return null;
  }
  
  // Determine folder based on file extension
  const ext = filename.split('.').pop().toLowerCase();
  
  if (ext === 'pdf' || ext === 'doc' || ext === 'docx') {
    return `/uploads/comprobantes/${filename}`;
  } else if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') {
    // Could be constancia or comprobante - default to comprobantes
    return `/uploads/comprobantes/${filename}`;
  }
  
  return `/uploads/${filename}`;
};

// Obtener historial de defensas completadas del profesional
const getDefensasHistorial = (req, res) => {
  const { profesionalId } = req.params;

  const query = `
    SELECT 
      d.id,
      d.estudiante,
      d.tipo_documento,
      d.fecha,
      d.hora,
      d.lugar,
      d.universidad,
      d.monto_interno,
      d.estado,
      p.id as postulacion_id,
      p.estado as postulacion_estado,
      p.constancia_asistencia,
      pg.id as pago_id,
      pg.estado as pago_estado,
      pg.comprobante
    FROM defensas d
    INNER JOIN postulaciones p ON d.id = p.defensa_id
    LEFT JOIN pagos pg ON d.id = pg.defensa_id AND pg.profesional_id = ?
    WHERE p.profesional_id = ? AND (d.estado = 'finalizado' OR p.estado = 'aceptado')
    ORDER BY d.fecha DESC
  `;

  db.query(query, [profesionalId, profesionalId], (err, results) => {
    if (err) {
      console.error("[ERROR] Database error:", err);
      return res.status(500).json({ error: "Error en la base de datos" });
    }
    
    // Fix corrupted file paths
    const fixedResults = results.map(row => ({
      ...row,
      constancia_asistencia: fixFilePath(row.constancia_asistencia),
      comprobante: fixFilePath(row.comprobante)
    }));
    
    console.log("[INFO] Fixed file paths for professional", profesionalId);
    res.json({ success: true, historial: fixedResults });
  });
};

module.exports = {
  getDefensasHistorial
};
