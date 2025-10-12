// Fix trip image paths: replace '/i/uploads/' with '/uploads/'
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', 'my-priject-data.sqlite3.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open DB', err);
    process.exit(1);
  }
});

const sql = "UPDATE trips SET img = replace(img, '/i/uploads/', '/uploads/') WHERE img LIKE '/i/uploads/%'";

db.run(sql, function(err) {
  if (err) {
    console.error('Update failed', err.message);
    db.close();
    process.exit(1);
  }
  console.log('Rows updated:', this.changes);
  // show affected rows
  db.all("SELECT id, img FROM trips WHERE img LIKE '/uploads/%' ORDER BY id DESC LIMIT 10", (err, rows) => {
    if (!err) console.log('Sample rows now using /uploads/:', rows.slice(0,10));
    db.close();
    process.exit(0);
  });
});
