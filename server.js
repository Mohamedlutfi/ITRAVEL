//--- LOAD THE PACKAGES 
const express=require('express')
const {engine}=require('express-handlebars')
const bodyParser=require('body-parser')
const bcrypt=require('bcrypt')
const session=require('express-session')
const sqlite3=require('sqlite3') // load the sqlite3 package
const connectSqlite3 = require('connect-sqlite3') // store the sessions in a SQLite3 database file
const multer = require('multer');
const path = require('path');
const fs = require('fs');


//--- DEFINE VARIABLES AND CONSTANTS
const port=8080
const app=express()

//const adminPassword='wdf#2025'
const adminPassword='$2b$12$p5.UuPb9Zh.siIc78Ie.Nu9eGx9d5OLT2pkecedig2P.6CdfL1ZUa'

//----------------------
//--- DEFINE MIDDLEWARES
//----------------------
//--- DEFINE THE PUBLIC DIRECTORY AS STATIC
app.use(express.static('public'))
//--- DEFINE HANDLEBARS AS THE TEMPLATING ENGINE
// Register simple helpers for templates (eq and or) so templates can do comparisons
app.engine('handlebars', engine({
  helpers: {
    eq: (a, b) => String(a) === String(b),
    or: function() {
      const args = Array.prototype.slice.call(arguments, 0, -1); // drop options
      return args.some(Boolean);
    }
  }
}))
app.set('view engine', 'handlebars')
app.set('views', './views')
//--- USE THE BODY-PARSER MIDDLEWARE TO USE POST FORMS
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

///--- CONNECT TO DATABASE
const dbFile='my-project-data.sqlite3.db'
db=new sqlite3.Database(dbFile)
//--- STORE SESSIONS IN THE DATABASE
const SQLiteStore = connectSqlite3(session) // store sessions in the database
//--- DEFINE THE SESSION
app.use(session({ // define the session
    store: new SQLiteStore({db: "session-db.db"}),
    "saveUninitialized": false,
    "resave": false,
    "secret": "This123Is@Another#456GreatSecret678%Sentence"
}))
const dab = new sqlite3.Database('./my-priject-data.sqlite3.db', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});
dab.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fullname TEXT,
  user TEXT UNIQUE,
  email TEXT UNIQUE,
  password TEXT
)`);

// Create trips table linked to users
dab.run(`CREATE TABLE IF NOT EXISTS trips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  title TEXT,
  description TEXT,
  img TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
)`);

// Create contacts table to store contact form submissions
dab.run(`CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT,
  subject TEXT,
  message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Create locations table to store allowed locations
dab.run(`CREATE TABLE IF NOT EXISTS locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE,
  description TEXT
)`);

// Create our_trips table to store curated images from public/img/trips
dab.run(`CREATE TABLE IF NOT EXISTS our_trips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  img TEXT,
  title TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Ensure trips table has a location_id column (SQLite allows ALTER TABLE ADD COLUMN)
dab.all("PRAGMA table_info(trips)", [], (err, cols) => {
  if (err) {
    console.error('Error inspecting trips table', err && err.message);
    return;
  }
  const hasLocation = (cols || []).some(c => c && c.name === 'location_id');
  if (!hasLocation) {
    dab.run('ALTER TABLE trips ADD COLUMN location_id INTEGER', (e) => {
      if (e) console.error('Failed to add location_id column to trips:', e.message);
      else console.log('Added location_id column to trips table');
    });
  }
});

// --- File upload setup (multer)
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } });

// --- Trips endpoints (authenticated)
// Create trip
app.post('/trips', ensureAuthenticated, upload.single('file'), (req, res) => {
  const userId = req.session.userData.id;
  const title = req.body.title || '';
  const description = req.body.description || '';
  const locationId = req.body.location_id ? Number(req.body.location_id) : null;
  const img = req.file ? '/uploads/' + req.file.filename : null;
  const sql = 'INSERT INTO trips (user_id, title, description, img, location_id) VALUES (?, ?, ?, ?, ?)';
  dab.run(sql, [userId, title, description, img, locationId], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    dab.get('SELECT trips.*, locations.name as location_name FROM trips LEFT JOIN locations ON trips.location_id = locations.id WHERE trips.id = ?', [this.lastID], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ trip: row });
    });
  });
});

// Get trips for current user
app.get('/trips', ensureAuthenticated, (req, res) => {
  const userId = req.session.userData.id;
  const sql = 'SELECT trips.*, locations.name as location_name FROM trips LEFT JOIN locations ON trips.location_id = locations.id WHERE trips.user_id = ? ORDER BY trips.created_at DESC';
  dab.all(sql, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ trips: rows });
  });
});

// Update trip (title, description, optional new file)
app.put('/trips/:id', ensureAuthenticated, upload.single('file'), (req, res) => {
  const userId = req.session.userData.id;
  const id = req.params.id;
  const title = req.body.title || '';
  const description = req.body.description || '';
  const locationId = req.body.location_id ? Number(req.body.location_id) : null;
  dab.get('SELECT * FROM trips WHERE id = ? AND user_id = ?', [id, userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Trip not found' });
    const newImg = req.file ? '/uploads/' + req.file.filename : row.img;
    dab.run('UPDATE trips SET title = ?, description = ?, img = ?, location_id = ? WHERE id = ?', [title, description, newImg, locationId, id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      // If a new file was uploaded and the row had an old image, remove it
      if (req.file && row.img) {
        const oldPath = path.join(__dirname, 'public', row.img.replace(/^\//, ''));
        fs.unlink(oldPath, (e) => { /* ignore unlink errors */ });
      }
      res.json({ updatedID: id });
    });
  });
});

// Delete trip
app.delete('/trips/:id', ensureAuthenticated, (req, res) => {
  const userId = req.session.userData.id;
  const id = req.params.id;
  dab.get('SELECT * FROM trips WHERE id = ? AND user_id = ?', [id, userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Trip not found' });
    dab.run('DELETE FROM trips WHERE id = ?', [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (row.img) {
        const oldPath = path.join(__dirname, 'public', row.img.replace(/^\//, ''));
        fs.unlink(oldPath, (e) => { /* ignore unlink errors */ });
      }
      res.json({ deletedID: id });
    });
  });
});

// Add a new user
app.post('/users', (req, res) => {
  const { name, email } = req.body;
  dab.run(`INSERT INTO users (name, email) VALUES (?, ?)`, [name, email], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ id: this.lastID });
  });
});

// Get all users
app.get('/users', (req, res) => {
  dab.all(`SELECT * FROM users`, [], (err, rows) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ users: rows });
  });
});

 app.delete('/users', async (req, res) => {
       // 1 == "1" // true
       // 1 === 1 // true // jämför typ och värde

        let {id} = req.body;
        dab.run(`DELETE FROM users WHERE id = ?`, [id], function(err) {
          if (err) {
            return res.status(400).json({ error: err.message });
          }
            res.json({ deletedID: id });
        });

    });



   app.put('/users', async (req, res) => {
  let { id, name, email } = req.body;

  if (!id) {
    return res.status(400).json({ error: "ID is required for update." });
  }

  // Om både name och email saknas, inget att uppdatera
  if (name == null && email == null) {
    return res.status(400).json({ error: "Nothing to update." });
  }

  // Om bara email finns – uppdatera email
  if (email != null && name == null) {
    dab.run(`UPDATE users SET email = ? WHERE id = ?`, [email, id], function (err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.json({ updatedID: id, updatedField: 'email' });
    });
    return;
  }

  // Om bara name finns – uppdatera name
  if (name != null && email == null) {
    dab.run(`UPDATE users SET name = ? WHERE id = ?`, [name, id], function (err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.json({ updatedID: id, updatedField: 'name' });
    });
    return;
  }

  // Om både name och email finns – uppdatera båda
  dab.run(`UPDATE users SET name = ?, email = ? WHERE id = ?`, [name, email, id], function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ updatedID: id, updatedField: 'name & email' });
  });
});

   


    app.delete('/users/table', async (req, res) => {
        dab.run(`DROP TABLE users`, function(err) {
          if (err) {
            return res.status(400).json({ error: err.message });
          }
        });
    });
          

let model=[

]

//--- MAKE THE SESSION AVAILABLE IN ALL HANDLEBAR FILES AT ONCE!
app.use((request, response, next) => {
    response.locals.session = request.session
    next()
})

//--- DEFINE THE ROUTES AND METHODS
app.get('/', (request, response) => {
    console.log('---> SESSION INFORMATION: ', JSON.stringify(request.session))
    response.render('home') // the landing page information
})
app.get('/contact', (request, response) => {
    response.render('contact') // the contact information
})

// Save contact form submissions
app.post('/contact-submit', (req, res) => {
  const { name, email, subject, message } = req.body || {};
  if (!name || !email || !message) {
    return res.render('contact', { error: 'Please fill in name, email and message.', name, email, subject, message });
  }
  const sql = 'INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)';
  dab.run(sql, [name, email, subject || '', message], function (err) {
    if (err) {
      console.error('Error saving contact', err.message);
      return res.render('contact', { error: 'Failed to save your message. Please try again later.' });
    }
    return res.render('contact', { message: 'Thank you — your message has been received!' });
  });
});
app.get('/home', (request, response) => { 
    response.render('home') // the landing page information
});
app.get('/gallary', (request, response) => {
    response.render('gallary') // the gallary information
});

app.get('/admin', ensureAdmin, (req, res) => {
  // Compute basic stats and render them server-side so admin sees numbers without waiting for JS
  dab.get('SELECT COUNT(*) AS userCount FROM users', [], (err, userRow) => {
    if (err) {
      console.error('Error computing admin stats (users):', err.message);
      return res.render('admin');
    }
    dab.get('SELECT COUNT(*) AS tripCount FROM trips', [], (err2, tripRow) => {
      if (err2) {
        console.error('Error computing admin stats (trips):', err2.message);
        return res.render('admin');
      }
      const userCount = userRow.userCount || 0;
      const tripCount = tripRow.tripCount || 0;
      const avg = userCount > 0 ? Number((tripCount / userCount).toFixed(2)) : 0;
      res.render('admin', { stats: { users: userCount, trips: tripCount, avgTripsPerUser: avg } });
    });
  });
});

// Public API: return all trips from all users (for the gallery)
app.get('/trips/all', (req, res) => {
  const sql = `SELECT trips.id, trips.user_id, trips.title, trips.description, trips.img, trips.created_at, users.user as username
               , locations.name as location_name
               FROM trips LEFT JOIN users ON trips.user_id = users.id
               LEFT JOIN locations ON trips.location_id = locations.id
               ORDER BY trips.created_at DESC`;
  dab.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ trips: rows });
  });
});
app.get('/about', (request, response) => {
    response.render('about') // the projects information
});
app.get('/listofprojects', (request,response) => {
    db.all('SELECT * FROM projects', (err, theProjects) => {
        if (err) {
            console.error(err.message);
            const model = { error: "Error retrieving projects from the database." }
            response.render('projects', model);
        } else {
            console.log(`---> Retrieved ${theProjects.length} projects from the database.`);
            console.log(`---> Projects: ${JSON.stringify(theProjects)}`);
            const model = { projects: theProjects };
            response.render('projects', model); // the list of persons
        }
    });
})
app.get('/listofskills', (request,response) => {
    db.all('SELECT * FROM skills', (err, theSkills) => {
        if (err) {
            console.error(err.message);
            const model = { error: "Error retrieving skills from the database." }
            response.render('skills', model);
        } else {
            console.log(`---> Retrieved ${theSkills.length} projects from the database.`);
            console.log(`---> Projects: ${JSON.stringify(theSkills)}`);
            const model = { skills: theSkills };
            response.render('skills', model); // the list of persons
        }
    });
})
//--- LOGIN FORM
app.get('/login', (request, response) => {
    response.render('login') // the login form to send to the client
})
app.get('/register', (request, response) => {
    response.render('register') // the register form to send to the client
})
app.post('/register', (request, response) => {
  const { fullname, user, email, password, passwordCheck } = request.body;

  // Define validation patterns
  const patterns = {
    name: /^[a-zA-Z ]+$/, // Only letters and spaces
    user: /^[a-zA-Z0-9_]{3,16}$/,
    email: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/, // Basic email pattern
    password: /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,24}$/ // Minimum 8 characters, at least one letter and one number
  };

  // Validate input fields
  if (
    fullname.length > 0 &&
    email.length > 0 &&
    password.length > 0 &&
    patterns.name.test(fullname) &&
    patterns.email.test(email) &&
    patterns.password.test(password) &&
    patterns.user.test(user) &&
    password === passwordCheck
  ) {
    // Hash the password before saving
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.error('Error hashing password', err.message);
        response.render('register', { message: "Error during registration. Please try again." });
        return;
      }

      const sql = 'INSERT INTO users (fullname, user, email, password) VALUES (?, ?, ?, ?)';
dab.run(sql, [fullname, user, email, hashedPassword], function(err) {
  if (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      console.error('Duplicate user or email', err.message);
      response.render('register', { message: "User or email already exists. Please try again." });
    } else {
      console.error('Error inserting user into database', err.message);
      response.render('register', { message: "Error during registration. Please try again." });
    }
    return;
  }
  console.log(`A new user has been inserted with rowid ${this.lastID}`);
  response.render('register', { message: "Registration successful!" });
});

}); 
  }});
  //--- LOGIN PROCESSING
  // Accept urlencoded and multipart/form-data (multer.none()) for compatibility with clients
  app.post('/login', upload.none(), (request, response) => {
    // Support two shapes:
    // - form posts: { email, password }
    // - legacy posts: { user, pw }
  const body = request.body || {};
  const email = body.email;
  const password = body.password;
  const user = body.user;
  const pw = body.pw;

    // Determine identifier and password value
    const identifier = email || user;
    const passwordToCheck = password || pw;

    // Helper to detect JSON/AJAX requests
    const wantsJSON = request.is('application/json') || (request.get('Accept') || '').includes('application/json') || request.xhr;

      // Special-case admin login: allow a built-in admin credential (not stored in users table)
      if (identifier === 'admin') {
        // Accept the configured admin password in plaintext for the special admin user.
        if (passwordToCheck === 'wdf#2025') {
          request.session.isLoggedIn = true;
          request.session.user = 'admin';
          request.session.un = 'admin';
          request.session.userData = { id: 0, user: 'admin', fullname: 'Administrator', isAdmin: true };
          console.log('---> ADMIN SESSION CREATED');
          if (wantsJSON) return response.json({ success: true, redirect: '/admin' });
          return response.redirect('/admin');
        }
        const model = { error: "Invalid username or password. Please try again." };
        if (wantsJSON) return response.status(401).json({ error: model.error });
        return response.render('login', model);
      }

    if (!identifier || !passwordToCheck) {
      const model = { error: "Please provide both username/email and password." };
      if (wantsJSON) {
        return response.status(400).json({ error: model.error });
      }
      return response.render('login', model);
    }

    // Choose SQL depending on whether identifier looks like an email
    const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(identifier);
    const sql = isEmail ? 'SELECT * FROM users WHERE email = ?' : 'SELECT * FROM users WHERE user = ?';

    dab.get(sql, [identifier], (err, row) => {
      if (err) {
        console.error('Error querying the database', err.message);
        const model = { error: "Error during login. Please try again." };
        if (wantsJSON) return response.status(500).json({ error: model.error });
        return response.render('login', model);
      }

      if (!row) {
        console.log('User not found');
        const model = { error: "Invalid username or password. Please try again." };
        if (wantsJSON) return response.status(401).json({ error: model.error });
        return response.render('login', model);
      }

      // Compare the provided password with the hashed password in the database
      bcrypt.compare(passwordToCheck, row.password, (err, result) => {
        if (err) {
          console.error('Error in password comparison', err.message);
          const model = { error: "Error during login. Please try again." };
          if (wantsJSON) return response.status(500).json({ error: model.error });
          return response.render('login', model);
        }


        if (result) {
          // Password matches, set session variables
          request.session.isLoggedIn = true;
          request.session.user = row.user; // make session.user available to templates
          request.session.un = row.user; // backward compatible name used in some templates
          request.session.userData = row; // Store user data in session
          console.log('---> SESSION INFORMATION: ', JSON.stringify(request.session));

          if (wantsJSON) {
            return response.json({ success: true, redirect: '/MyProfile' });
          }
          return response.redirect('/MyProfile'); // Redirect to MyProfile page
        } else {
          console.log('Wrong password');
          const model = { error: "Invalid username or password. Please try again." };
          if (wantsJSON) return response.status(401).json({ error: model.error });
          return response.render('login', model);
        }
      });
    });
  });

  app.get('/MyProfile', ensureAuthenticated, (request, response) => {
    // User is guaranteed to be authenticated by the middleware
    const userData = request.session.userData; // Retrieve user data from session
    // Fetch this user's trips so the page can render them server-side on first load
    dab.all('SELECT * FROM trips WHERE user_id = ? ORDER BY created_at DESC', [userData.id], (err, rows) => {
      if (err) {
        console.error('Error fetching trips for profile', err.message);
        // Fall back to rendering without trips
          // still fetch locations to render the form
          dab.all('SELECT id, name FROM locations ORDER BY name ASC', [], (err2, locs) => {
            return response.render('MyProfile', { user: userData, trips: [], locations: locs || [] });
          });
      }
        // also fetch available locations to populate the select
        dab.all('SELECT id, name FROM locations ORDER BY name ASC', [], (err2, locs) => {
          if (err2) {
            console.error('Error fetching locations for profile', err2.message);
            return response.render('MyProfile', { user: userData, trips: rows || [], locations: [] });
          }
          response.render('MyProfile', { user: userData, trips: rows || [], locations: locs || [] }); // Render the profile page with user data, trips and locations
        });
    });
  });

// Optional: small reusable middleware for protecting routes
function ensureAuthenticated(req, res, next) {
  if (req.session && req.session.isLoggedIn && req.session.userData && req.session.userData.id) return next();
  return res.redirect('/login');
}

// Admin-check middleware
function ensureAdmin(req, res, next) {
  if (req.session && req.session.isLoggedIn && req.session.user === 'admin') return next();
  // allow userData.isAdmin flag for future flexibility
  if (req.session && req.session.userData && req.session.userData.isAdmin) return next();
  return res.status(403).send('Forbidden');
}

// Admin routes (simple API)
app.get('/admin/users', ensureAdmin, (req, res) => {
  dab.all('SELECT id, fullname, user, email FROM users ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ users: rows });
  });
});

app.delete('/admin/users/:id', ensureAdmin, (req, res) => {
  const id = req.params.id;
  dab.run('DELETE FROM users WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deletedID: id });
  });
});

app.get('/admin/trips', ensureAdmin, (req, res) => {
  dab.all('SELECT trips.id, trips.title, trips.description, trips.img, users.user as username FROM trips LEFT JOIN users ON trips.user_id = users.id ORDER BY trips.created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ trips: rows });
  });
});

// Admin: list contact submissions
app.get('/admin/contacts', ensureAdmin, (req, res) => {
  dab.all('SELECT id, name, email, subject, message, created_at FROM contacts ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ contacts: rows });
  });
});

// Admin: statistics overview
app.get('/admin/stats', ensureAdmin, (req, res) => {
  // Run three queries and combine results
  dab.get('SELECT COUNT(*) AS userCount FROM users', [], (err, userRow) => {
    if (err) return res.status(500).json({ error: err.message });
    dab.get('SELECT COUNT(*) AS tripCount FROM trips', [], (err2, tripRow) => {
      if (err2) return res.status(500).json({ error: err2.message });
      const userCount = userRow.userCount || 0;
      const tripCount = tripRow.tripCount || 0;
      const avg = userCount > 0 ? (tripCount / userCount) : 0;
      res.json({ stats: { users: userCount, trips: tripCount, avgTripsPerUser: Number(avg.toFixed(2)) } });
    });
  });
});

// Admin: delete a contact entry
app.delete('/admin/contacts/:id', ensureAdmin, (req, res) => {
  const id = req.params.id;
  dab.run('DELETE FROM contacts WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deletedID: id });
  });
});

// Admin: manage locations
app.get('/admin/locations', ensureAdmin, (req, res) => {
  dab.all('SELECT id, name, description FROM locations ORDER BY name ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ locations: rows });
  });
});

app.post('/admin/locations', ensureAdmin, (req, res) => {
  const { name, description } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Name required' });
  dab.run('INSERT INTO locations (name, description) VALUES (?, ?)', [name, description || ''], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    dab.get('SELECT id, name, description FROM locations WHERE id = ?', [this.lastID], (e, row) => {
      if (e) return res.status(500).json({ error: e.message });
      res.json({ location: row });
    });
  });
});

app.delete('/admin/locations/:id', ensureAdmin, (req, res) => {
  const id = req.params.id;
  dab.run('DELETE FROM locations WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deletedID: id });
  });
});

app.delete('/admin/trips/:id', ensureAdmin, (req, res) => {
  const id = req.params.id;
  dab.get('SELECT * FROM trips WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Trip not found' });
    dab.run('DELETE FROM trips WHERE id = ?', [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (row.img) {
        const oldPath = path.join(__dirname, 'public', row.img.replace(/^\//, '')); fs.unlink(oldPath, (e) => { /* ignore */ });
      }
      res.json({ deletedID: id });
    });
  });
});

//--- LOGOUT PROCESSING
app.get('/logout', (req, res) => {
    req.session.destroy( (err) => { // destroy the current session
        if (err) {
            console.log("Error while destroying the session: ", err)
            res.redirect('/') // go back to homepage
        } else {
            console.log('Logged out...')
            res.redirect('/') // go back to homepage
        }
    })
})

//--- LISTEN TO INCOMING REQUESTS
app.listen(port, () => {
    hashPassword("wdf#2025", 12); // hash the password "wdf#2025"
    console.log(`Server running on http://localhost:${port}`)
})

function hashPassword(pw, saltRounds) {
    bcrypt.hash(pw, saltRounds, function(err, hash) {
        if (err) {
            console.log('---> Error hashing password:', err);
        } else {
            console.log(`---> Hashed password: ${hash}`);
        }
    });
}      
