const express = require("express");
const router = express.Router();
const {
  getNotificaciones,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotificacion,
  deleteNotificacion,
  getAdminNotificaciones
} = require("../controllers/notificacionesController");

// Admin notifications - must come BEFORE generic :usuarioId routes
router.get("/admin/list", getAdminNotificaciones);

// Professional notifications - specific routes before generic :usuarioId
router.get("/:usuarioId/unread", getUnreadCount);
router.put("/:usuarioId/read-all", markAllAsRead);

// Generic routes
router.get("/:usuarioId", getNotificaciones);
router.put("/:notificacionId/read", markAsRead);
router.post("/", createNotificacion);
router.delete("/:notificacionId", deleteNotificacion);

module.exports = router;
