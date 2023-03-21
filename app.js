const express = require('express');
const app = express();
const port = 8000;
const nunjucks = require('nunjucks');
const session = require('express-session')
const path = require('path');

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
    password : 'passpass' // fallo de seguridad
});

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
/* app.post ('/sesion??', (req, res)=>{
    let user = req.body.username;
    let password = req.body.password;
    'INSERT INTO ' // insertar user y password en db, control de sesiones
}); */

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

app.get('/queja/:id', (req, res) => {
    let id = req.params.id;
    connection.query('SELECT * FROM quejas2 WHERE id=?', id, function (err, rows, _) {
        if (err) {
            throw err;
        }
        console.log(rows);
        // Y si no da nada?
        res.render("queja.html", {complain: rows[0]});
    });

}); 

app.get ('/new', (_, res)=> {
    res.render ("newmessage.html");
});

// connection.end();

/* el objeto re.body => si en el formulario hemos puesto name=texto, lo q se envía es texto: y lo q ponga el usuario */
