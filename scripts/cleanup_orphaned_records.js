const sqlite3 = require('sqlite3');
const fs = require('fs');
const path = require('path');

const db = new sqlite3.Database('./my-priject-data.sqlite3.db');

console.log('Cleaning up orphaned image records...');

db.all('SELECT id, title, img FROM trips WHERE img IS NOT NULL', (err, rows) => {
  if (err) {
    console.error('Error:', err);
    return;
  }

  const toDelete = [];
  
  rows.forEach(row => {
    const filePath = path.join('public', row.img);
    if (!fs.existsSync(filePath)) {
      toDelete.push(row);
      console.log(`Will delete: ID ${row.id} - "${row.title}" (missing file: ${row.img})`);
    }
  });

  if (toDelete.length === 0) {
    console.log('No orphaned records found!');
    db.close();
    return;
  }

  console.log(`\nFound ${toDelete.length} orphaned records. Delete them? (y/n)`);
  
  // For now, just show what would be deleted
  console.log('Run with DELETE=true environment variable to actually delete');
  
  if (process.env.DELETE === 'true') {
    let deleted = 0;
    toDelete.forEach(row => {
      db.run('DELETE FROM trips WHERE id = ?', [row.id], (err) => {
        if (err) {
          console.error(`Error deleting ${row.id}:`, err);
        } else {
          deleted++;
          console.log(`Deleted: ${row.title}`);
        }
        
        if (deleted === toDelete.length) {
          console.log(`\nDeleted ${deleted} orphaned records.`);
          db.close();
        }
      });
    });
  } else {
    db.close();
  }
});