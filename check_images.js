const sqlite3 = require('sqlite3');
const fs = require('fs');
const path = require('path');

const db = new sqlite3.Database('./my-priject-data.sqlite3.db');

db.all('SELECT COUNT(*) as total FROM trips', (err, countRows) => {
  console.log('Total trips in database:', countRows[0].total);
  
  db.all('SELECT id, title, img FROM trips ORDER BY id DESC', (err, rows) => {
    if (err) {
      console.error(err);
      return;
    }
    
    console.log('\nAll trips (newest first):');
    console.log('==========================');
    
    rows.forEach(row => {
      if (row.img) {
        const filePath = path.join('public', row.img);
        const exists = fs.existsSync(filePath);
        console.log(`ID ${row.id}: "${row.title}" -> ${row.img} [${exists ? 'EXISTS' : 'MISSING'}]`);
      } else {
        console.log(`ID ${row.id}: "${row.title}" -> NO IMAGE`);
      }
    });
    
    db.close();
  });
});