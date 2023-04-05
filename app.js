/* 
TODO:
limitación tamaño / tipo de archivo -- multer / q me devuelva imagen q se suba en queja
separar módulos (db migrations)
mensajes flash
ERROR: invalid csrf token
barra de búsqueda que me busque queja por id
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
const { doubleCsrf } = require('csrf-csrf');
const cookieParser = require('cookie-parser');

const doubleCsrfOptions = {
    getSecret: () => "Secret", // Es una función para poder rotarlo periódicamente, no debería estar en este documento ni ser tan sencillo
    cookieName: "__Host-psifi.x-csrf-token", // Se recomienda usar el prefijo host
    size: 64,
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
    getTokenFromRequest: (req) => req.body.csrf_token
};

const {
    generateToken, // Esto es lo que se debe usar en las rutas para generar un CSRF token hasheado
    doubleCsrfProtection, // middleware por defecto de protección CSRF
} = doubleCsrf(doubleCsrfOptions); 

app.use(express.urlencoded({ extended: true })); // para que el servidor procese bien los datos del formulario
app.use("/static", express.static(path.resolve(__dirname, 'static')));
app.use("/uploads", express.static('uploads'));
app.use(cookieParser('thisismysecrctekeyfhrgfgrfrty84fwir767'));
app.use (flash);

nunjucks.configure('views', {
    autoescape: true,
    express: app
});

const mysql = require('mysql');
const { emitWarning } = require('process'); // q es esto por dios
// Esta información debería estar en un archivo a parte que NO esté bajo control de versiones
const connection = mysql.createConnection( {
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

function flash(req, res, next) {
    console.log(req.session);
    if (req.session && req.session.flash) {
        req.locals = {}; 
        req.locals.flash = req.session.flash;
        delete req.session.flash;
    }
    next();
}

app.post('/login', doubleCsrfProtection, (req, res) => {
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
                    req.session.userId = result[0].password;
                    console.log(req.session.userId);
                    req.session.flash = "¡Bienvenid@, " + username + "!";
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

app.post('/queja', upload.single('imagen'), isLogged, doubleCsrfProtection, (req, res) => {
    if (req.session.userId) {
        console.log(req.session.userId);
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
            res.redirect('/');
        });
    } else {
        res.redirect('/');
    }
});

app.post('/newuser', doubleCsrfProtection, (req, res) => {
    bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
        if (err) throw err;
        let data = {
            username: req.body.username,
            password: hash // guarda pass hasheada
        }
        connection.query('INSERT INTO users SET ?',
            data,
            (err, _) => {
                if (err) throw err;
                res.send('Usuario registrado');
            });
    });
    // en tabla users - q hay campos user, password y id. cuando separe los módulos hago el JOIN, para q al hacer el login me compruebe si está registrado en users
});

/* app.post ('/', (req, res) => { // para hacer barra busqueda q me busque quejas por id
    let id = req.params.id;
    connection.query ('SELECT * FROM quejas2 WHERE id = ?', )
}) */

app.get('/logout', isLogged, (req, res) => {
    req.session.userId = null;
    req.session.regenerate((err) => { if (err) throw err; });
    console.log('Sesión cerrada');
    res.redirect('/');
});

app.get('/newuser', (req, res) => {
    let token = generateToken(res, req); // orden argumentos inverso
    res.render('newuser.html', {csrf_token: token});
});

app.get('/new', isLogged, (req, res) => {
    let token = generateToken(res, req);
    res.render('newmessage.html', {csrf_token: token});
});

app.get('/login', (req, res) => {
    let token = generateToken(res, req);
    res.render('login.html', {csrf_token: token});
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

app.get('/', (req, res) => {
    console.log(req.locals); // me da undefined porq en algún punto del login la sesión se pierde
    let mensaje = req.locals ? req.locals.flash : null; // si req.locals = true return flash, else return null
    connection.query('SELECT body, date, files FROM quejas2', function (err, result, _) {
        if (err) {
            throw err;
        }
        console.log(result);
        res.render("index.html", { complains: result, dateFormat: (d) => d.toDateString(), mensaje_flash: mensaje });
    });
});

app.listen(port);
// connection.end();