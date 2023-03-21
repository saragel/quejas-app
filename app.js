const express = require('express');
const app = express();
const port = 8000;
const nunjucks = require('nunjucks');
const path = require('path');

/* TODO: bcrypt
    sessions
    separa módulo sessions
    crear barra búsqueda q me busque queja por id */

app.listen (port);
app.use(express.urlencoded({ extended: true })); // para que el servidor procese bien los datos del formulario
app.use("/static", express.static( path.resolve(__dirname, 'static')));

nunjucks.configure('views', {
    autoescape: true,
    express: app
});

const mysql = require('mysql');
const connection = mysql.createConnection ({
    host : 'localhost',
    database : 'quejas',
    user : 'quejas',
    password : 'passpass' // fallo de seguridad, usar bcrypt
});

const session = require('express-session');
const oneDay = 1000 * 60 * 60 * 24; // tiempo de un día usando milisegundos

// session middleware
app.use(session({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767", // (hash) lo q se utiliza para encriptar la "sessionid", lo q se guarda en la cookie
    saveUninitialized:true,
    cookie: { maxAge: oneDay }, // el tiempo q el navegador tarda en eliminar la cookie
    resave: false 
}));

connection.connect(function(err){
    if (err) {
        console.error('Connection error:' + err.stack); 
        return;
    }
    console.log ('Connected succesfully!'); 
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

app.get ('/login', (_, res)=> {
    res.render ("login.html");
});

app.post ('/queja', (req, res)=> { // mete lo q se introduza en los campos del form (keja y fexa) en los campos respectivos de la db
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
        res.render("queja.html", {complain: rows[0]}); 
        }
        // TODO: cambiar formato fecha
    });
}); 

// connection.end();

/* el objeto re.body => si en el formulario hemos puesto name=texto, lo q se envía es texto: y lo q ponga el usuario */
