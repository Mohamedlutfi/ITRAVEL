const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./my-priject-data.sqlite3.db');
 db.all("SELECT name FROM sqlite_master WHERE type='table'", (e, r) => {
  if (e) console.error(e);
  else console.log('tables:', r.map(x => x.name));
  db.close();
});
