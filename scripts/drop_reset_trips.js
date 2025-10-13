#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Adjust path to match the DB used in server.js
const dbFile = path.resolve(__dirname, '..', 'my-priject-data.sqlite3.db');

if (!fs.existsSync(dbFile)) {
  console.error('Database file not found:', dbFile);
  process.exit(1);
}

const backupFile = dbFile + `.backup.${Date.now()}.db`;
fs.copyFileSync(dbFile, backupFile);
console.log('Backup created at', backupFile);

const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error('Failed to open DB:', err.message);
    process.exit(1);
  }
});

db.serialize(() => {
  db.run('PRAGMA foreign_keys = OFF;');
  db.run('BEGIN TRANSACTION;');

  db.run('DROP TABLE IF EXISTS trips;', function(err) {
    if (err) console.error('Error dropping trips table:', err.message);
    else console.log('Dropped trips (if it existed).');
  });

  db.run("DELETE FROM sqlite_sequence WHERE name='trips';", function(err) {
    // If sqlite_sequence doesn't exist (no AUTOINCREMENT used before), this may error — ignore safely
    if (err) console.error('Error resetting sqlite_sequence for trips (may be OK):', err.message);
    else console.log('Reset sqlite_sequence for trips.');
  });

  // Recreate the trips table (same schema as server.js, including location_id)
  db.run(`CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    description TEXT,
    img TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    location_id INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );`, function(err) {
    if (err) console.error('Error creating trips table:', err.message);
    else console.log('Recreated trips table.');
  });

  db.run('COMMIT;', function(err) {
    if (err) console.error('Commit error:', err.message);
    else console.log('Transaction committed.');
  });
});

db.close((err) => {
  if (err) console.error('Error closing DB:', err.message);
  else console.log('DB closed.');
});
