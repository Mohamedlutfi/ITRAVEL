import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import bodyParser from 'body-parser';
import sqlite3 from "sqlite3";
sqlite3.verbose();//to get more detailed error messages
let sql;

const db = new sqlite3.Database('./test.db',sqlite3.OPEN_READWRITE,(err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the database.');
});

// Create Users table if it doesn't exist
// sql = `CREATE TABLE IF NOT EXISTS Users (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     email TEXT UNIQUE,
//     password TEXT
// )`; 
// db.run(sql, (err) => {
//     if (err) {
//         console.error(err.message);
//     }
//     console.log('Users table created or already exists.');
// });
console.log("Hello from app.js");

const app = express();
const port = 3000;

app.use(express.json());
app.use(bodyParser.json());
const SECRET = "mysecretkey";

app.get('/', (req, res) => { //read
    res.send("Welcome to the Express server!");
}); 

// Users data
let users = [
];

app.post('/register', async (req, res) => {// Create a new user
try {
    const { id,email, password } = req.body;
    const userExists = users.find((user) => user.email == email);
    if (userExists) {
        return res.status(400).send({ message: "The email is used" });
    }
    else {
        const hashedPassword = await bcrypt.hash(password,10);
        users.push({ id,email, password: hashedPassword });
        console.log(JSON.stringify(users));
        return res.status(201).send({ message: "User registered successfully" });//2** success / status code 4** = clinet error / status code 5** = server error /  1** status code = information/ 3** status code = redirection / 
    }}  
    catch (err) {
        res.status(500).send(message= err.message);
    }
});

app.post('/login', async (req, res) => {// Login user (Create)
    try {
        const { email, password } = req.body;
        const userExists = users.find((user) => user.email == email);//true
        if (!userExists) {
        return res.status(400).send({ message: "The user is not found" });
    }
    else {

        if (await bcrypt.compare(password,userExists.password)){//comparing hashed password

            res.status(200).send({ message: "Login successful" });
            const token = jwt.sign({ email: userExists.email }, SECRET, { expiresIn: "1h"});
            res.json({ token });// send token to the client

        }
        else{
            return res.status(400).send({ message: "Wrong password" });
        }
        
    }}
    
    catch (err) {
        res.status(500).send(message= err.message);
    }   
});

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];//
    if (token == null) return res.sendStatus(401);  // if there isn't any token

    jwt.verify(token, SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next(); // pass the execution off to whatever request the client intended
    });

}
app.delete('/login', (req, res) => {//Delete user
    let id = req.body.id;
    let index = users.findIndex((user) => user.id === id);
    users.splice(index);
    console.log(JSON.stringify(users));
    res.send("User deleted");
});

app.put('/login',async (req, res) => {//Update user password
    let id = req.body.id;
    let password = req.body.password;
    let index = users.findIndex((user) => user.id === id);
    const hashedPassword = await bcrypt.hash(password,10);

    users[index].password = hashedPassword;

    console.log(JSON.stringify(users));
    res.send("User updated");
});
// all operations are done on CRUD (Create Read Update Delete)
app.get('/Profile', authenticateToken, (req, res) => {
    res.send('Welcome to your profile, ' + req.user.email);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
 //hello