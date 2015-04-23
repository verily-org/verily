var fs = require('fs'),
    http = require('http');


function start() {
    require('./server')(false, null);
}

if (process.argv.indexOf('-postgres') != -1) {
    var index = process.argv.indexOf('-postgres');
    if (process.argv[index+1]) {
        process.env.DATABASE = 'postgres';
        process.env.DB_URL = 'postgres://'+process.argv[index+1];
    } else {
        console.log('If you want to start the server with a posgres database please provide the url of the database in the following format:',
            ' -postgres <user>:<password>@<hostname>/<database_name>');
        process.exit(1);
    }
    process.env.DATABASE = 'postgres';
} else {
    process.env.DATABASE = 'sqlite';
}

if (process.argv[3] && (process.argv[3] === '-r' || process.argv[3] === '-reset')) {
    fs.unlink('app.db', function (err) {
        if (!err) {
            start();
        } else {
            console.log('Cannot delete app.db. May be it is in use? Server has to terminate.');
            process.exit(1);
        }
    });
} else {
    start();
}

