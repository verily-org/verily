var fs = require('fs'),
    http = require('http');

function start() {
    require('./server')(false, null);
}

if (process.argv[2] && (process.argv[2] === '-r' || process.argv[2] === '-reset')) {
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