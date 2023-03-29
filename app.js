/* TODO:
    bcrypt
    sessions con JWT
    sessions con MYSQL
    crear barra búsqueda q me busque queja por id 
    para siguiente app => ORM: x ejemplo sequelize */

const express = require('express');
const app = express();
const port = 8000;
const nunjucks = require('nunjucks');
const path = require('path');
const session = require('express-session');
const model = require('./model');
const db = require('./db');

app.listen(port);
app.use(express.urlencoded({ extended: true })); // para que el servidor procese bien los datos del formulario
app.use("/static", express.static(path.resolve(__dirname, 'static')));

nunjucks.configure('views', {
    autoescape: true,
    express: app
});

//session + cookie config
const oneDay = 1000 * 60 * 60 * 24;
app.use(session({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized: true,
    cookie: { secure: false, maxAge: oneDay },
    resave: false
}));

function isLogged(req, res, next) { // argumento rutas q queramos proteger
    if (req.session.userId !== undefined) {
        next();
        console.log('Bien autenticado');
    } else {
        res.send('Necesitas logearte');
    }
}

app.post('/login', async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    let user = await db.getUserByUsername (username);
    if (!username || !password) {
        res.send('Por favor, introduce tus credenciales');
    }
    /* TODO: function comprobación credenciales usando bcrypt //

            req.session.userId = result[0].id; // lo recuerda fuera de esta función porq guardado en el objeto session, q está en la memoria del ordenador en general
            req.session.save((err) => { if (err) throw err; });
            res.redirect('/');
        });
    } else {
        res.send('Credenciales incorrectas');
    } */
}); 

app.post('/queja', isLogged, (req, res) => {
    //if(req.session.userid) {
    // meter la queja
    //} else {
    // redireccionar a login
    //}
    let data = {
        body: req.body.keja,
        date: new Date()
    };
    connection.query('INSERT INTO quejas2  SET ?', data, function (err, _, _) {
        if (err) {
            throw err;
        }
        console.log('Values added succesfully!');
    });
    res.redirect('/');
});

app.post ('/newuser', (req, res) => {
    let username = req.body.username;
    connection.query ('SELECT ')
    // se guarda en la tabla users, dentro de la db quejas; esta tabla tiene un id, un username y una password
});

app.get('/new', isLogged, (_, res) => {
    res.render("newmessage.html");
});

app.get('/login', (_, res) => {
    res.render("login.html");
});

app.get('/notfound', (_, res) => {
    res.render('error.html');
});

app.get('/:id', isLogged, (req, res) => {
    let id = req.params.id;
    connection.query('SELECT * FROM quejas2 WHERE id = ?', id, function (err, rows, _) {
        if (err) {
            throw err;
        }
        console.log(rows);
        if (rows.length == 0) {
            console.log('Complain not found!');
            res.redirect('/notfound');
        }
        else {
            console.log('Complain found!');
            res.render("queja.html", { complain: rows[0], dateFormat: (d) => d.toDateString() });
        }
    });
});

app.get('/', async (_, res) => {
    let quejas = await db.getQuejas();
        res.render("index.html", { quejas: quejas, dateFormat: (d) => d.toDateString() });
    });
    
// connection.end();