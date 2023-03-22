const express = require('express');
const app = express();
const port = 8000;
const nunjucks = require('nunjucks');
const path = require('path');

/* TODO: bcrypt
    sessions
    separa módulo sessions
    crear barra búsqueda q me busque queja por id 
    db migrations */

app.listen (port);
app.use(express.urlencoded({ extended: true })); // para que el servidor procese bien los datos del formulario
app.use("/static", express.static( path.resolve(__dirname, 'static')));

nunjucks.configure('views', {
    autoescape: true,
    express: app
});

const mysql = require('mysql');
// Esta información debería estar en un archivo a parte que NO esté bajo control de versiones
const connection = mysql.createConnection ({
    host : 'localhost',
    database : 'quejas',
    user : 'quejas',
    password : 'passpass'
});

connection.connect(function(err){
    if (err) {
        console.error('Connection error:' + err.stack); 
        return;
    }
    console.log ('Connected succesfully!'); 
});


const sessions = require('express-session');
const oneDay = 1000 * 60 * 60 * 24; // tiempo de un día usando milisegundos

app.use(sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767", // (hash) lo q se utiliza para encriptar el sessionid, lo q se guarda en la cookie
    saveUninitialized:true,
    cookie: { maxAge: oneDay }, 
    resave: false 
}));

/*
// usuario y contraseña q se deberán autenticar, pendiente hacerlo en db
const myusername = 'user1'
const mypassword = 'mypassword'  // fallo de seguridad, usar bcrypt


//autenticación
app.post('/login', (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    if (!username || !password) {
        res.send('Please, enter your credentials');
        return;
    }

    if (username == myusername || password == mypassword) {
        console.log('Correct credentials!');
        userId = req.session.userId;
        // res.redirect ('/'); 
    } else {
        res.send('Incorrect credentials!');
    }

}); */

// en DB, q he metio a pelo: username: sara, password: sara

/* function isAuthenticated (req, res, next) { // meterla en argumentos app.get de las rutas q queramos proteger
    console.log (req.session.userId);
    if (req.session.userId ){
        next();
        return; // necesario cortar función
    } else {
        res.send ('Necesitas logearte');
    }
} */

app.post ('/login', (req, res)=>{
    let user = req.body.username;
    let pass = req.body.password;
    connection.query ('SELECT * FROM users'), (err, result, _){
        if (err) {
            throw err;
        }
        console.log (result);
        if (result.length == 1 && result[0].password == pass) { // usar bcrypt
            req.session.userId = result[0].id;
            res.send ('Credenciales correctas');
        } else {
            res.send ('Credenciales inválidos');
        }
    }
}); 

app.get ('/login', (_, res)=> {
    res.render ("login.html");
});

app.get ('/', (_, res)=>{
    connection.query ('SELECT body, date FROM quejas2', function (err, result, _) {
        if (err) {
            throw err;
        }
        console.log (result);
        res.render ("index.html", {complains: result, dateFormat: (d)=> d.toDateString()}); 
    });
});

app.post ('/queja', (req, res)=> { // introduce campos formulario
    if(req.session.userid){
        // meter la queja
    } else {
        // redireccionar a login
    }

    let data = {
        body: req.body.keja,
        date: new Date () 
    };
    connection.query ('INSERT INTO quejas2  SET ?', data, function (err, _, _) { // la ? mete el objeto data
        if (err) {
            throw err;
        }
        console.log ('Values added succesfully!');
    });
    res.redirect('/');
}); 

app.get ('/new', (_, res)=> {
    res.render ("newmessage.html");
});

app.get ('/notfound', (_, res)=>{
    res.render ('error.html');
});

app.get('/:id', (req, res) => {
    let id = req.params.id;
    connection.query('SELECT * FROM quejas2 WHERE id = ?', id, function (err, rows, _) {
        if (err) {
            throw err;
        }
        console.log(rows);
        if (rows.length == 0) {
            console.log ('Complain not found!');
            res.redirect ('/notfound');
        }
        else {
        console.log ('Complain found!');
        res.render("queja.html", {complain: rows[0], dateFormat: (d)=> d.toDateString()}); 
        }
    });
}); 

// connection.end();

/* el objeto re.body => si en el formulario hemos puesto name=texto, lo q se envía es texto: y lo q ponga el usuario */
