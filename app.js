const express = require('express');
const app = express();
const port = 3000;
const nunjucks = require('nunjucks');

app.listen (port);
app.use(express.urlencoded({ extended: true }));

nunjucks.configure('views', {
    autoescape: true,
    express: app
});

const mysql = require('mysql');
const connection = mysql.createConnection ({
    host : 'localhost',
    database : 'quejas',
    user : 'quejas_admin',
    password : 'quejaspass' // fallo de seguridad
});

connection.connect(function(err){
    if (err) {
        console.error('Connection error:' + err.stack); 
        return;
    }
    console.log ('Connected succesfully:' + connection.threadId); 
});

let complain = new Object ();
complain.body = connection.query ('SELECT body FROM quejas2', function (results){
    return results.forEach ();
});
complain.date = connection.query ('SELECT date from quejas2', function (results){
    return results.forEach ();
})

app.get ('/', (_, res)=>{
    res.render ("index.html");
});
app.get ('/login', (_, res)=>{
    res.render ("login.html");
});

connection.end ();