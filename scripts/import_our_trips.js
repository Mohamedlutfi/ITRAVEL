const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');

const dbPath = path.join(__dirname, '..', 'my-priject-data.sqlite3.db');
const db = new sqlite3.Database(dbPath);
const imgDir = path.join(__dirname, '..', 'public', 'img', 'trips');

if (!fs.existsSync(imgDir)) {
  console.error('Image directory does not exist:', imgDir);
  process.exit(1);
}

const files = fs.readdirSync(imgDir).filter(f => /\.(jpe?g|png|gif|webp)$/i.test(f));
console.log('Found files:', files.length);

let inserted = 0;

function insertFile(fname, cb) {
  const imgPath = '/img/trips/' + fname;
  const title = path.parse(fname).name.replace(/[-_]/g, ' ').replace(/\d+/g, '').trim() || fname;
  db.get('SELECT id FROM our_trips WHERE img = ?', [imgPath], (err, row) => {
    if (err) return cb(err);
    if (row) return cb(null, false); // already exists
    db.run('INSERT INTO our_trips (img, title) VALUES (?, ?)', [imgPath, title], function (e) {
      if (e) return cb(e);
      inserted++;
      cb(null, true);
    });
  });
}

(function run() {
  if (!files.length) {
    console.log('No image files found.');
    db.close();
    process.exit(0);
  }
  let i = 0;
  function next() {
    if (i >= files.length) {
      console.log('Done. Inserted:', inserted);
      db.all('SELECT id, img, title FROM our_trips LIMIT 5', (e, rows) => { console.log('Sample rows:', rows); db.close(); process.exit(0); });
      return;
    }
    insertFile(files[i], (err, ok) => {
      if (err) console.error('Error inserting', files[i], err.message);
      i++;
      next();
    });
  }
  next();
})();
