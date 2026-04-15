const db = require('./config/db');
const fs = require('fs');
const path = require('path');

console.log('[INFO] Starting notifications table setup...');

// Read migration file
const migrationPath = path.join(__dirname, 'migrations', '001_create_notifications.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Split by statement and execute each one
const statements = migrationSQL.split(';').filter(stmt => stmt.trim());

let executedCount = 0;

statements.forEach((statement, index) => {
  const cleanStatement = statement.trim();
  if (cleanStatement) {
    db.query(cleanStatement, (err, result) => {
      if (err) {
        console.error(`[ERROR] Statement ${index + 1} failed:`, err.message);
      } else {
        executedCount++;
        console.log(`[SUCCESS] Statement ${index + 1} executed successfully`);
      }

      // Close connection after last statement
      if (index === statements.length - 1) {
        setTimeout(() => {
          console.log(`[SUMMARY] ${executedCount}/${statements.length} statements executed`);
          db.end(() => {
            console.log('[INFO] Database connection closed');
            process.exit(0);
          });
        }, 500);
      }
    });
  }
});

// Handle errors
db.on('error', (err) => {
  console.error('[ERROR] Database connection error:', err);
  process.exit(1);
});
