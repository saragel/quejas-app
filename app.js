/* 
TODO:
limitación tamaño / tipo de archivo -- multer / q me devuelva imagen q se suba en queja
separar módulos (db migrations)
mensajes flash
doublecsrf
barra de búsqueda que me busque queja por id
logout
NO ME DEJA ACCEDER A RUTAS PROTEGIDAS  (ya abrí issue de eso)
*/

const express = require('express');
const app = express();
const port = 8000;
const nunjucks = require('nunjucks');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const saltRounds = 10; // define la complejidad con la q se hashea la password
const multer = require('multer');
const upload = multer({ dest: 'uploads' });
const serveStatic = require('serve-static')

app.listen(port);
app.use(express.urlencoded({ extended: true })); // para que el servidor procese bien los datos del formulario
app.use("/static", express.static(path.resolve(__dirname, 'static')));
app.use(express.static('uploads'));
app.use(serveStatic('uploads'));
//app.use(cookieParser());

nunjucks.configure('views', {
    autoescape: true,
    express: app
});

const mysql = require('mysql');
const { emitWarning } = require('process');
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
    console.log(req.session);
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
        return;
    }
    connection.query('SELECT * FROM users WHERE ?', { username: username }, (err, result) => {
        if (err) throw err;
        if (result.length !== 1) {
            res.send('Credenciales inválidos');
            return;
        }
        bcrypt.compare(password, result[0].password, (err, correct) => { // en la base de datos se guarda hasheada, así q con poner result[0].password vale
            if (err) throw err;
            if (correct) {
                // almacena info del usuario en el parámetro de la sesión userId q yo he establecido
                req.session.regenerate(function (err) {
                    if (err) throw err;
                    req.session.userId = result[0].password; // ????
                    console.log(req.session.userId);
                    req.session.save(function (err) {
                        if (err) throw err;
                        console.log('Credenciales correctas');
                        res.redirect('/');
                    });
                });
            } else {
                res.send('Credenciales inválidos');
            }
        });
    });
});

app.post('/queja', upload.single('imagen'), isLogged, (req, res) => {
    if (req.session.userId) {
        console.log (req.session.userId);
        let data = {
            body: req.body.keja,
            date: new Date(),
            files: req.file.path
        };
        connection.query('INSERT INTO quejas2  SET ?', data, function (err, _, _) {
            if (err) {
                throw err;
            }
            console.log('Values added succesfully!');
        });
    } else {
        res.redirect ('/');
    }
});

app.post('/newuser', (req, res) => {
    bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
        if (err) throw err;
        let data = {
            username: req.body.username,
            password: hash, // guarda pass hasheada
        }
        console.log (req.file);
        connection.query('INSERT INTO users SET ?',
            data,
            (err, _) => {
                if (err) throw err;
                console.log('Usuario registrado');
                res.send('Usuario registrado');
            });
    });
    // en tabla users - q hay campos user, password y id. cuando separe los módulos hago el JOIN, para q al hacer el login me compruebe si está registrado en users
});

app.get ('/logout', isLogged, (req, res) => {
    req.session.userId = null;
    req.session.regenerate ((err) => { if (err) throw err; });
    res.send ('Sesión cerrada');
});

app.get('/newuser', (_, res) => {
    res.render('newuser.html');
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