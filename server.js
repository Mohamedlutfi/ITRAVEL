//--- LOAD THE PACKAGES 
const express=require('express')
const {engine}=require('express-handlebars')
const bodyParser=require('body-parser')
const bcrypt=require('bcrypt')
const session=require('express-session')
const sqlite3=require('sqlite3') // load the sqlite3 package
const connectSqlite3 = require('connect-sqlite3') // store the sessions in a SQLite3 database file


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
app.engine('handlebars', engine())
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
  name TEXT,
  email TEXT
)`);

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
//l
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
app.get('/home', (request, response) => { 
    response.render('home') // the landing page information
});
app.get('/skills', (request, response) => {
    response.render('skills') // the skills information
});
app.get('/projects', (request, response) => {
    response.render('projects') // the projects information
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
    response.render('register') // the login form to send to the client
})
//--- LOGIN PROCESSING
app.post('/login', (request, response) => {
    // the treatment of the data received from the client form
    console.log(`Here comes the data received from the form on the client: ${request.body.un} - ${request.body.pw} `)
    if (request.body.un==="admin") {
        bcrypt.compare(request.body.pw, adminPassword, (err, result) => {
            if (err) {
                console.log('Error in password comparison')
                model = { error: "Error in password comparison." }
                response.render('login', model)
            }
            if (result){
                request.session.isLoggedIn=true
                request.session.un=request.body.un
                request.session.isAdmin=true
                console.log('---> SESSION INFORMATION: ', JSON.stringify(request.session)) 
                response.render('loggedin')
            } else {
                console.log('Wrong password')
                model = { error: "Wrong password! Please try again." }
                response.render('login', model)
            }
        })
    } else {
        console.log('Wrong username')
        model = { error: "Wrong username! Please try again." }
        response.render('login', model)
    }
})


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


