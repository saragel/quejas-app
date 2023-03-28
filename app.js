/* TODO:
    bcrypt
    sessions con JWT
    sessions con MYSQL
    crear barra búsqueda q me busque queja por id 
    separar módulos: sesiones, db migrations
    para siguiente app => ORM: a través d clases, muestra los datos ordenados en vez de en rows
    importante para gestionar datos de tablas en objetos de JavaScript, lo malo esq no sabemos bien cómo funcionan internamente
    x ejemplo sequelize */

const express = require('express');
const app = express();
const port = 8000;
const nunjucks = require('nunjucks');
const path = require('path');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

app.listen(port);
app.use(express.urlencoded({ extended: true })); // para que el servidor procese bien los datos del formulario
app.use("/static", express.static(path.resolve(__dirname, 'static')));

nunjucks.configure('views', {
    autoescape: true,
    express: app
});

const options = {
	host: 'localhost',
	port: 3306, // otro puerto diferente q en el q tenemos la app pa la memoria de mysql
	user: 'session_test',
	password: 'password',
	database: 'session_test'
};

const sessionStore = new MySQLStore(options);

app.use(session({
	key: 'my_key',
	secret: 'my_secret',
	store: sessionStore,
	resave: false,
	saveUninitialized: true
}));

sessionStore.onReady().then(() => {
	console.log('Storage ready!');
}).catch(err => {
	console.error('Storage error' + err);
});

const mysql = require('mysql');
// Esta información debería estar en un archivo a parte que NO esté bajo control de versiones
const connection = mysql.createConnection({
    host: 'localhost',
    database: 'quejas',
    user: 'quejas',
    password: 'passpass'
});

connection.connect(function (err) {
    if (err) {
        console.error('Connection error:' + err);
        return;
    }
    console.log('Connected succesfully!');
});

//cookie config
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

app.post('/login', (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    if (!username || !password) {
        res.send('Por favor, introduce tus credenciales');
    }
    if (username == 'sara' || password == 'sara') { 
        console.log('Correct credentials!');
        connection.query('SELECT * FROM users', function (err, result, _) {
            if (err) {
                throw err;
            }
            console.log(result[0]);
            req.session.userId = result[0].id; // lo recuerda fuera de esta función porq guardado en el objeto session, q está en la memoria del ordenador en general
            req.session.save((err) => { if (err) throw err; });
            res.redirect('/');
        });
    } else {
        res.send('Credenciales incorrectas');
    }
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
    // vamos a ver en q tabla me está guardando las cosas por dios q no lo entiendo
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

app.get('/', (_, res) => {
    connection.query('SELECT body, date FROM quejas2', function (err, result, _) {
        if (err) {
            throw err;
        }
        console.log(result);
        res.render("index.html", { complains: result, dateFormat: (d) => d.toDateString() });
    });
});

// connection.end();