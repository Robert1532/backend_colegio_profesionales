#!/usr/bin/env node
/**
 * Script de verificación de fixes aplicados
 * Ejecutar: node backend/verify_fixes.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(70));
console.log('VERIFICACIÓN DE FIXES APLICADOS');
console.log('='.repeat(70) + '\n');

let allChecks = true;

// Check 1: Verify init_uploads.js exists
console.log('1. Verificando init_uploads.js...');
const initUploadsPath = path.join(__dirname, 'init_uploads.js');
if (fs.existsSync(initUploadsPath)) {
  console.log('   ✅ init_uploads.js existe');
} else {
  console.log('   ❌ init_uploads.js NO EXISTE');
  allChecks = false;
}

// Check 2: Verify init_tables.js exists
console.log('\n2. Verificando init_tables.js...');
const initTablesPath = path.join(__dirname, 'init_tables.js');
if (fs.existsSync(initTablesPath)) {
  console.log('   ✅ init_tables.js existe');
} else {
  console.log('   ❌ init_tables.js NO EXISTE');
  allChecks = false;
}

// Check 3: Verify server.js includes init_tables
console.log('\n3. Verificando que server.js inicializa tablas...');
const serverPath = path.join(__dirname, 'server.js');
const serverContent = fs.readFileSync(serverPath, 'utf8');
if (serverContent.includes('init_tables') || serverContent.includes('initializeTables')) {
  console.log('   ✅ server.js inicializa tablas');
} else {
  console.log('   ❌ server.js NO inicializa tablas');
  allChecks = false;
}

// Check 4: Verify postulacionesRoutes accepts constancia field
console.log('\n4. Verificando postulacionesRoutes.js...');
const postulacionesRoutesPath = path.join(__dirname, 'routes/postulacionesRoutes.js');
const postulacionesRoutesContent = fs.readFileSync(postulacionesRoutesPath, 'utf8');
if (postulacionesRoutesContent.includes("upload.single('constancia')")) {
  console.log('   ✅ postulacionesRoutes acepta campo "constancia"');
} else {
  console.log('   ❌ postulacionesRoutes NO acepta campo "constancia"');
  allChecks = false;
}

// Check 5: Verify uploadAttendanceCertificate stores full path
console.log('\n5. Verificando uploadAttendanceCertificate...');
const postulacionesControllerPath = path.join(__dirname, 'controllers/postulacionesController.js');
const postulacionesControllerContent = fs.readFileSync(postulacionesControllerPath, 'utf8');
if (postulacionesControllerContent.includes('/uploads/constancias/')) {
  console.log('   ✅ uploadAttendanceCertificate guarda ruta completa');
} else {
  console.log('   ❌ uploadAttendanceCertificate NO guarda ruta completa');
  allChecks = false;
}

// Check 6: Verify notifications created on defense creation
console.log('\n6. Verificando notificaciones en defensa...');
if (postulacionesControllerContent.includes('INSERT INTO notificaciones')) {
  console.log('   ✅ Se crean notificaciones al crear postulación');
} else {
  console.log('   ❌ NO se crean notificaciones al crear postulación');
  allChecks = false;
}

// Check 7: Verify defensasController creates notifications
console.log('\n7. Verificando notificaciones en defensasController...');
const defensasControllerPath = path.join(__dirname, 'controllers/defensasController.js');
const defensasControllerContent = fs.readFileSync(defensasControllerPath, 'utf8');
if (defensasControllerContent.includes('INSERT INTO notificaciones') && defensasControllerContent.includes('defensa_creada')) {
  console.log('   ✅ Se crean notificaciones al crear defensa');
} else {
  console.log('   ❌ NO se crean notificaciones al crear defensa');
  allChecks = false;
}

// Check 8: Verify pagosController creates notifications
console.log('\n8. Verificando notificaciones en pagosController...');
const pagosControllerPath = path.join(__dirname, 'controllers/pagosController.js');
const pagosControllerContent = fs.readFileSync(pagosControllerPath, 'utf8');
if (pagosControllerContent.includes('pago_recibido')) {
  console.log('   ✅ Se crean notificaciones al procesar pago');
} else {
  console.log('   ❌ NO se crean notificaciones al procesar pago');
  allChecks = false;
}

// Check 9: Verify uploads directory structure
console.log('\n9. Verificando directorios de carga...');
const uploadsDir = path.join(__dirname, 'uploads');
const constanciasDir = path.join(uploadsDir, 'constancias');
const comprobantesDir = path.join(uploadsDir, 'comprobantes');

let directoriesOK = true;
if (!fs.existsSync(uploadsDir)) {
  console.log('   ⚠️  Directorio /uploads no existe (se creará al iniciar servidor)');
  directoriesOK = false;
}
if (!fs.existsSync(constanciasDir)) {
  console.log('   ⚠️  Directorio /uploads/constancias no existe (se creará al iniciar servidor)');
  directoriesOK = false;
}
if (!fs.existsSync(comprobantesDir)) {
  console.log('   ⚠️  Directorio /uploads/comprobantes no existe (se creará al iniciar servidor)');
  directoriesOK = false;
}
if (directoriesOK) {
  console.log('   ✅ Directorios de carga existen');
} else {
  console.log('   ℹ️  Los directorios se crearán automáticamente al iniciar el servidor');
}

// Check 10: Verify notificaciones routes
console.log('\n10. Verificando notificaciones routes...');
const notificacionesRoutesPath = path.join(__dirname, 'routes/notificaciones.js');
const notificacionesRoutesContent = fs.readFileSync(notificacionesRoutesPath, 'utf8');
if (notificacionesRoutesContent.includes('/admin/list')) {
  console.log('   ✅ Rutas de notificaciones configuradas correctamente');
} else {
  console.log('   ❌ Rutas de notificaciones NO están configuradas');
  allChecks = false;
}

// Summary
console.log('\n' + '='.repeat(70));
if (allChecks) {
  console.log('✅ TODOS LOS FIXES HAN SIDO APLICADOS CORRECTAMENTE');
  console.log('='.repeat(70));
  console.log('\nPróximos pasos:');
  console.log('1. Reinicia el servidor: npm start (o tu comando de inicio)');
  console.log('2. Verifica logs para mensajes de inicialización');
  console.log('3. Prueba subiendo una constancia desde la app');
  console.log('4. Verifica que las notificaciones se crean en la BD');
  console.log('='.repeat(70) + '\n');
  process.exit(0);
} else {
  console.log('❌ ALGUNOS FIXES NO ESTÁN CORRECTAMENTE APLICADOS');
  console.log('='.repeat(70) + '\n');
  process.exit(1);
}
