const express = require("express");
const router = express.Router();
const {
  getReminder,
  getAllReminders,
  recordReminderSent
} = require("../controllers/whatsappController");

// Get reminder for specific defensa and professional
router.get("/reminder/:defensaId/:profesionalId", getReminder);

// Get all pending reminders (admin)
router.get("/reminders/all", getAllReminders);

// Record that admin sent a reminder
router.post("/reminder/record", recordReminderSent);

module.exports = router;
