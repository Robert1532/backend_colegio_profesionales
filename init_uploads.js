const fs = require('fs');
const path = require('path');

// Create upload directories if they don't exist
const uploadDirs = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'uploads/comprobantes'),
  path.join(__dirname, 'uploads/constancias'),
  path.join(__dirname, 'uploads/documentos')
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`[INFO] Created directory: ${dir}`);
  }
});

module.exports = uploadDirs;
