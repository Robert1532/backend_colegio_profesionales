// Initialize database tables on server startup
module.exports = function initializeTables(db) {
  // Create notificaciones table if it doesn't exist
  const createNotificacionesTable = `
    CREATE TABLE IF NOT EXISTS \`notificaciones\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`usuario_id\` INT NULL DEFAULT NULL,
      \`tipo\` VARCHAR(50) NULL DEFAULT NULL COMMENT 'postulacion, defensa_creada, pago_recibido, solicitud_recibida, aceptacion, rechazo',
      \`defensa_id\` INT NULL DEFAULT NULL,
      \`profesional_id\` INT NULL DEFAULT NULL,
      \`titulo\` VARCHAR(255) NULL DEFAULT NULL,
      \`mensaje\` TEXT NULL DEFAULT NULL,
      \`motivo\` TEXT NULL DEFAULT NULL,
      \`leida\` BOOLEAN DEFAULT FALSE,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      INDEX \`idx_notificaciones_usuario\` (\`usuario_id\` ASC),
      INDEX \`idx_notificaciones_tipo\` (\`tipo\` ASC),
      INDEX \`idx_notificaciones_defensa\` (\`defensa_id\` ASC),
      INDEX \`idx_notificaciones_profesional\` (\`profesional_id\` ASC),
      INDEX \`idx_notificaciones_leida\` (\`leida\` ASC),
      INDEX \`idx_notificaciones_created_at\` (\`created_at\` ASC),
      CONSTRAINT \`notificaciones_ibfk_1\`
        FOREIGN KEY (\`usuario_id\`)
        REFERENCES \`usuarios\` (\`id\`)
        ON DELETE CASCADE,
      CONSTRAINT \`notificaciones_ibfk_2\`
        FOREIGN KEY (\`defensa_id\`)
        REFERENCES \`defensas\` (\`id\`)
        ON DELETE CASCADE,
      CONSTRAINT \`notificaciones_ibfk_3\`
        FOREIGN KEY (\`profesional_id\`)
        REFERENCES \`usuarios\` (\`id\`)
        ON DELETE CASCADE
    )
    ENGINE = InnoDB
    AUTO_INCREMENT = 1
    DEFAULT CHARACTER SET = utf8mb4
    COLLATE = utf8mb4_unicode_ci
  `;

  db.query(createNotificacionesTable, (err) => {
    if (err) {
      // Only log if it's not a "table already exists" error
      if (!err.message.includes("already exists")) {
        console.error("[ERROR] Error creating notificaciones table:", err.message);
      } else {
        console.log("[SUCCESS] Notificaciones table exists");
      }
    } else {
      console.log("[SUCCESS] Notificaciones table initialized");
    }
  });

  // Add esPrivilegido column to usuarios if it doesn't exist
  const addPrivilegedColumn = `
    ALTER TABLE \`usuarios\` 
    ADD COLUMN IF NOT EXISTS \`esPrivilegido\` BOOLEAN DEFAULT FALSE
  `;

  db.query(addPrivilegedColumn, (err) => {
    if (err && !err.message.includes("already exists")) {
      console.warn("[WARNING] Error adding esPrivilegido column:", err.message);
    } else if (!err) {
      console.log("[SUCCESS] esPrivilegido column verified");
    }
  });

  // Add nombre_estudiante column to defensas if it doesn't exist
  const addNombreEstudianteColumn = `
    ALTER TABLE \`defensas\` 
    ADD COLUMN IF NOT EXISTS \`nombre_estudiante\` VARCHAR(200) NULL
  `;

  db.query(addNombreEstudianteColumn, (err) => {
    if (err && !err.message.includes("already exists")) {
      console.warn("[WARNING] Error adding nombre_estudiante column:", err.message);
    } else if (!err) {
      console.log("[SUCCESS] nombre_estudiante column verified");
    }
  });
};
