// en producción, este archivo no debería estar en el control de versiones

const mysql = require('mysql');
const model = require('./model');

const connection = mysql.createConnection({
    host: 'localhost',
    database: 'quejas',
    user: 'quejas',
    password: 'passpass'
});

connection.connect((err) => {
    if (err) {
        console.error('Connection error:' + err);
        return;
    }
    console.log('Connected succesfully!');
});

function getQuejas() {
    return new Promise((resolve, reject => {
        connection.query('SELECT * FROM quejas2 Q JOIN users U ON Q.authors = U.id', // para q en el resultado el autor se corresponda con su usuario (a través del user id)
            (err, rows, _) => {
                if (err) reject(err);
                let result = rows.map((row) => {
                    new model.Queja(row.body, row.date, new model.User(row.id, row.username));
                });
                resolve(result);
            });
    }));
}

function insertQueja(queja) { 
    return new Promise ((resolve, reject) => {
        if (err) reject (err);
        connection.query('INSERT INTO quejas2 SET ?',
        {body: queja.body, date: new Date()},
        function (err) {
            if (err) reject (err);
            resolve(); }
        );
    });
}

function getUserByUsername(username) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM users WHERE ?',
            { username: username }, // esto es así por cómo lo define la librería estándar para añadir seguridad; internamente es username == username
            (err, result) => {
                if (err) reject(err);
                resolve(new model.User(result[0].id, result[0].username, result[0].password))
            });
    });
}

/* function insertUser(/*userid?*/) { } */

module.exports = {
    getQuejas: getQuejas,
    insertQueja: insertQueja,
    getUserByUsername: getUserByUsername,
    insertUser: insertUser
}