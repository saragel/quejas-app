/* se hace con clases en vez de con objetos porque:
-JavaScript sitúa su prototupo directamente (el nombre de la clase)
-es más fácil introducirle funcionalidades */

class Queja {
    constructor(body, date, author) {
        this.body = body;
        this.date = date;
        this.author = author // en db este campo es authors
    }
}

class User {
    constructor(id, username, password) {
        this.id = id;
        this.username = username;
        this.password = password;
    }
}

module.exports = { // en algún momento, mirar otra forma de exportar
    Queja: Queja,
    User: User
}