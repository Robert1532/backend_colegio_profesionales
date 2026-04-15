const nodemailer = require('nodemailer');
require('dotenv').config({ path: __dirname + '/../.env' });
// Configurar transporter de Nodemailer
// Usa credenciales de variable de entorno
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Función para enviar correo de aceptación
const enviarCorreoAceptacion = async (correoProf, nombreProfesional, nombreDefensa, nombreEstudiante) => {
  try {
    if (!correoProf || correoProf.trim() === '') {
      console.warn(`[WARNING] Correo vacío para ${nombreProfesional}`);
      return false;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: correoProf,
      subject: `¡Felicidades! Fuiste aceptado para la defensa de ${nombreEstudiante}`,
      html: `
        <h2>¡Felicidades ${nombreProfesional}!</h2>
        <p>Has sido aceptado como profesor revisor para la defensa de:</p>
        <p><strong>${nombreEstudiante}</strong> - ${nombreDefensa}</p>
        <p>Por favor, revisa los detalles de la defensa en tu panel de profesional.</p>
        <p>Saludos cordiales,<br>Equipo de Defensas</p>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Aceptación enviada exitosamente a ${correoProf}`);
    console.log(`[EMAIL] Message ID: ${result.messageId}`);
    return true;
  } catch (error) {
    console.error(`[ERROR] Error enviando correo de aceptación:`, error.message);
    console.error(`[ERROR] Stack:`, error.stack);
    return false;
  }
};

// Función para enviar correo de rechazo
const enviarCorreoRechazo = async (correoProf, nombreProfesional, nombreDefensa, nombreEstudiante, motivo) => {
  try {
    if (!correoProf || correoProf.trim() === '') {
      console.warn(`[WARNING] Correo vacío para ${nombreProfesional}`);
      return false;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: correoProf,
      subject: `Tu postulación para la defensa de ${nombreEstudiante}`,
      html: `
        <h2>Hola ${nombreProfesional},</h2>
        <p>Lamentablemente, tu postulación para la defensa de <strong>${nombreEstudiante}</strong> ha sido rechazada.</p>
        <p><strong>Motivo:</strong> ${motivo || 'No especificado'}</p>
        <p>Puedes intentar postularte a otras defensas disponibles en tu panel.</p>
        <p>Saludos cordiales,<br>Equipo de Defensas</p>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Rechazo enviado exitosamente a ${correoProf}`);
    console.log(`[EMAIL] Message ID: ${result.messageId}`);
    return true;
  } catch (error) {
    console.error(`[ERROR] Error enviando correo de rechazo:`, error.message);
    console.error(`[ERROR] Stack:`, error.stack);
    return false;
  }
};

// Función genérica para enviar cualquier tipo de correo
const enviarEmail = async (correo, asunto, html) => {
  try {
    if (!correo || correo.trim() === '') {
      console.warn('[WARNING] Correo vacío');
      return false;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: correo,
      subject: asunto,
      html: html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Correo enviado exitosamente a ${correo}`);
    console.log(`[EMAIL] Message ID: ${result.messageId}`);
    return true;
  } catch (error) {
    console.error(`[ERROR] Error enviando correo:`, error.message);
    console.error(`[ERROR] Stack:`, error.stack);
    return false;
  }
};

module.exports = {
  enviarCorreoAceptacion,
  enviarCorreoRechazo,
  enviarEmail,
};
