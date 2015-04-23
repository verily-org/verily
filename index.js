var fs = require('fs'),
    http = require('http');


var on_http_request = function (req, res) {
    console.log('on_http_request');
    console.log('req.url', req.url);
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.write("Veri.ly is temporarily down for maintenance\n..sorry for the inconvenience.\nIn the mean time you can contact us via contact@veri.ly");
    res.end();
    return;
};

server = http.createServer(on_http_request);

server.listen(process.env.PORT || 3000);

/*
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
*/

