const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  getPostulaciones,
  getPostulacionById,
  getPostulacionesByProfesional,
  getPostulacionesByDefensa,
  createPostulacion,
  updatePostulacion,
  deletePostulacion,
  uploadAttendanceCertificate,
} = require("../controllers/postulacionesController");

// Configure multer for certificate uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/constancias'));
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
    console.log('[v0] - Extension:', path.extname(file.originalname).toLowerCase());
    
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const extname = path.extname(file.originalname).toLowerCase();
    
    // Only check extension - MIME type is unreliable on Android
    if (allowedExtensions.includes(extname)) {
      console.log('[v0] File accepted - extension:', extname);
      cb(null, true);
    } else {
      const errorMsg = `Solo se permiten archivos: PDF, DOC, DOCX, JPG, PNG. Recibido: ${extname}`;
      console.error('[v0] File rejected:', errorMsg);
      cb(new Error(errorMsg));
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB para PDFs
});

// Middleware wrapper for certificate upload - accepts both 'constancia' and 'certificate'
const uploadCertificate = (req, res, next) => {
  // Try 'constancia' first (Flutter app field name), then 'certificate'
  upload.single('constancia')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // If constancia failed, try certificate field name
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        console.log('[v0] constancia field not found, trying certificate field');
        return upload.single('certificate')(req, res, (err2) => {
          if (err2) {
            console.error('[v0] Multer error:', err2.code, err2.message);
            return res.status(400).json({
              success: false,
              error: `Upload error: ${err2.message}`,
            });
          }
          // If file exists, add filename to body
          if (req.file) {
            req.body.constancia_asistencia = req.file.filename;
          }
          next();
        });
      }
      console.error('[v0] Multer error:', err.code, err.message);
      return res.status(400).json({
        success: false,
        error: `Upload error: ${err.message}`,
      });
    } else if (err) {
      console.error('[v0] Upload error:', err.message);
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
    // If file exists, add filename to body
    if (req.file) {
      req.body.constancia_asistencia = req.file.filename;
    }
    next();
  });
};

router.get("/", getPostulaciones);
router.get("/:id", getPostulacionById);
router.get("/defensa/:defensaId", getPostulacionesByDefensa);
router.get("/profesional/:profesionalId", getPostulacionesByProfesional);
router.post("/", createPostulacion);
router.put("/:id", updatePostulacion);
router.post("/:id/certificate", uploadCertificate, uploadAttendanceCertificate);
router.delete("/:id", deletePostulacion);

module.exports = router;
