const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
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
} = require("../controllers/pagosController");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/comprobantes'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    console.log('[v0] Upload attempt:');
    console.log('[v0] - Original name:', file.originalname);
    console.log('[v0] - MIME type:', file.mimetype);
    console.log('[v0] - Extension:', path.extname(file.originalname).toLowerCase());
    
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    const extname = path.extname(file.originalname).toLowerCase();
    
    // Only check extension - MIME type is unreliable on Android
    if (allowedExtensions.includes(extname)) {
      console.log('[v0] File accepted - extension:', extname);
      return cb(null, true);
    } else {
      const errorMsg = `Solo se permiten archivos: PDF, JPG, PNG. Recibido: ${extname}`;
      console.error('[v0] File rejected:', errorMsg);
      cb(new Error(errorMsg));
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB para PDFs
});

// Get all pagos
router.get("/", getPagos);

// Get pago by ID (must come before /verificar for proper routing)
router.get("/:id", getPagoById);

// Verify pago exists
router.get("/verificar", verificarPago);

// Get completed defense payments (pending payment processing)
router.get("/completed-defenses/all", getCompletedDefensePayments);

// Get pagos by estado
router.get("/estado/:estado", getPagosByEstado);

// Get pagos by profesional (must come before other GET routes)
router.get("/profesional/:profesionalId", getPagosByProfesional);

// Upload comprobante for a pago with error handling
router.post("/:id/upload", (req, res, next) => {
  upload.single('comprobante')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('[v0] Multer error:', err.code, err.message);
      return res.status(400).json({ 
        success: false,
        error: `Upload error: ${err.message}`,
        status: 400 
      });
    } else if (err) {
      console.error('[v0] Upload error:', err.message);
      return res.status(400).json({ 
        success: false,
        error: err.message,
        status: 400 
      });
    }
    next();
  });
}, uploadComprobante);

// Create pago with optional comprobante file
router.post("/", (req, res, next) => {
  upload.single('comprobante')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('[v0] Multer error in POST /:', err.code);
      return res.status(400).json({ 
        success: false,
        error: `Upload error: ${err.message}`,
      });
    } else if (err) {
      console.error('[v0] Upload error in POST /:', err.message);
      return res.status(400).json({ 
        success: false,
        error: err.message,
      });
    }
    // Add filename to body if file was uploaded
    if (req.file) {
      req.body.comprobante = req.file.filename;
    }
    next();
  });
}, createPago);

// Update pago status
router.put("/:id", updatePagoStatus);

// Delete pago
router.delete("/:id", deletePago);

module.exports = router;
