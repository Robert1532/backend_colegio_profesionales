const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { enviarEmail } = require("../services/emailService");

const JWT_SECRET = process.env.JWT_SECRET || "secretkey_change_in_production";

// Login endpoint
router.post("/login", (req, res) => {
  const { correo, password } = req.body;

  // Validate input
  if (!correo || !password) {
    return res.status(400).json({ error: "Correo y password son requeridos" });
  }

  db.query(
    "SELECT * FROM usuarios WHERE correo = ?",
    [correo],
    async (err, result) => {
      if (err) {
        console.error("[ERROR] Database error:", err);
        return res.status(500).json({ error: "Error en la base de datos" });
      }

      if (result.length === 0) {
        return res.status(401).json({ error: "Usuario no existe" });
      }

      const user = result[0];

      try {
        const valid = await bcrypt.compare(password, user.password);

        if (!valid) {
          return res.status(401).json({ error: "Password incorrecto" });
        }

        const token = jwt.sign({ id: user.id, rol: user.rol }, JWT_SECRET, {
          expiresIn: "24h"
        });

        res.json({
          success: true,
          token,
          user: {
            id: user.id,
            nombre: user.nombre,
            apellido: user.apellido,
            correo: user.correo,
            rol: user.rol,
            especialidad: user.especialidad,
            estado: user.estado,
            foto_perfil: user.foto_perfil,
            esPrivilegido: user.debe_cambiar_password === 1 || user.debe_cambiar_password === true
          }
        });
      } catch (error) {
        console.error("[ERROR] Authentication error:", error);
        return res.status(500).json({ error: "Error en la autenticación" });
      }
    }
  );
});

// Register endpoint
router.post("/register", async (req, res) => {
  const { nombre, apellido, correo, password, telefono, rol, especialidad, codigo_registro } =
    req.body;

  // Validate input
  if (!nombre || !apellido || !correo || !password || !rol) {
    return res.status(400).json({
      error: "Nombre, apellido, correo, password y rol son requeridos"
    });
  }

  // Validate registration code for professionals
  if (rol === 'profesional' && !codigo_registro) {
    return res.status(400).json({
      error: "Código de registro es requerido para profesionales"
    });
  }

  try {
    // Check if user already exists
    db.query("SELECT * FROM usuarios WHERE correo = ?", [correo], async (err, result) => {
      if (err) {
        console.error("[ERROR] Database error:", err);
        return res.status(500).json({ error: "Error en la base de datos" });
      }

      if (result.length > 0) {
        return res.status(400).json({ error: "El correo ya está registrado" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Build query based on role
      let query, params;
      if (rol === 'profesional' && codigo_registro) {
        query = `INSERT INTO usuarios (nombre, apellido, correo, telefono, password, rol, especialidad, codigo_registro, estado)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')`;
        params = [nombre, apellido, correo, telefono, hashedPassword, rol, especialidad, codigo_registro];
      } else {
        query = `INSERT INTO usuarios (nombre, apellido, correo, telefono, password, rol, especialidad, estado)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente')`;
        params = [nombre, apellido, correo, telefono, hashedPassword, rol, especialidad];
      }

      // Insert user
      db.query(query, params, (err, result) => {
        if (err) {
          console.error("[ERROR] Database error:", err);
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "Ese código de registro ya ha sido usado" });
          }
          return res.status(500).json({ error: "Error al registrar el usuario" });
        }

        res.status(201).json({
          success: true,
          message: "Usuario registrado exitosamente",
          userId: result.insertId
        });
      });
    });
  } catch (error) {
    console.error("[ERROR] Register error:", error);
    return res.status(500).json({ error: "Error al registrar el usuario" });
  }
});

// Verify token endpoint
router.post("/verify", (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token requerido" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ success: true, user: decoded });
  } catch (error) {
    console.error("[ERROR] Token verification error:", error);
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
});

// Change password endpoint - Primera vez (esPrivilegido)
router.post("/cambiar-contrasena-primera-vez", (req, res) => {
  const { usuarioId, nuevaContrasena } = req.body;

  if (!usuarioId || !nuevaContrasena) {
    return res.status(400).json({ error: "Usuario ID y nueva contraseña son requeridos" });
  }

  if (nuevaContrasena.length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
  }

  try {
    // Hash nueva contraseña
    bcrypt.hash(nuevaContrasena, 10, (err, hashedPassword) => {
      if (err) {
        console.error("[ERROR] Hash error:", err);
        return res.status(500).json({ error: "Error al procesar la contraseña" });
      }

      // Actualizar contraseña y marcar que ya no necesita cambio
      db.query(
        "UPDATE usuarios SET password = ?, debe_cambiar_password = FALSE WHERE id = ?",
        [hashedPassword, usuarioId],
        (err, result) => {
          if (err) {
            console.error("[ERROR] Database error:", err);
            return res.status(500).json({ error: "Error en la base de datos" });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
          }

          res.json({
            success: true,
            message: "Contraseña actualizada exitosamente"
          });
        }
      );
    });
  } catch (error) {
    console.error("[ERROR] Change password error:", error);
    return res.status(500).json({ error: "Error al cambiar la contraseña" });
  }
});

// Change password endpoint - Cambio normal
router.post("/cambiar-contrasena", (req, res) => {
  const { usuarioId, contrasenaActual, nuevaContrasena } = req.body;

  if (!usuarioId || !contrasenaActual || !nuevaContrasena) {
    return res.status(400).json({ error: "Todos los campos son requeridos" });
  }

  if (nuevaContrasena.length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
  }

  try {
    // Obtener usuario actual
    db.query("SELECT * FROM usuarios WHERE id = ?", [usuarioId], async (err, result) => {
      if (err) {
        console.error("[ERROR] Database error:", err);
        return res.status(500).json({ error: "Error en la base de datos" });
      }

      if (result.length === 0) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const user = result[0];

      try {
        // Verificar contraseña actual
        const valid = await bcrypt.compare(contrasenaActual, user.password);

        if (!valid) {
          return res.status(401).json({ error: "Contraseña actual incorrecta" });
        }

        // Hash nueva contraseña
        const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);

        // Actualizar contraseña y marcar que ya no requiere cambio
        db.query(
          "UPDATE usuarios SET password = ?, debe_cambiar_password = FALSE WHERE id = ?",
          [hashedPassword, usuarioId],
          (err, updateResult) => {
            if (err) {
              console.error("[ERROR] Database error:", err);
              return res.status(500).json({ error: "Error en la base de datos" });
            }

            // Enviar email de confirmación
            const asunto = "Tu contraseña ha sido actualizada";
            const html = `
              <h2>Hola ${user.nombre} ${user.apellido},</h2>
              <p>Tu contraseña ha sido actualizada exitosamente.</p>
              <p>Si no realizaste este cambio, por favor contacta con soporte inmediatamente.</p>
              <p>Saludos cordiales,<br>Equipo de Defensas</p>
            `;
            enviarEmail(user.correo, asunto, html).catch(error => {
              console.error("[ERROR] Error enviando email:", error);
            });

            res.json({
              success: true,
              message: "Contraseña actualizada exitosamente"
            });
          }
        );
      } catch (error) {
        console.error("[ERROR] Verification error:", error);
        return res.status(500).json({ error: "Error al verificar la contraseña" });
      }
    });
  } catch (error) {
    console.error("[ERROR] Change password error:", error);
    return res.status(500).json({ error: "Error al cambiar la contraseña" });
  }
});

module.exports = router;
