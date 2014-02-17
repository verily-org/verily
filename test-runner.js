var emitter = require('./event-emitter')();
var fs = require('fs');

fs.unlink('app.db', function (err) {
    // Ignore error if there was one, as it is likely to indicate
    // that the file doesn't exist (it was already deleted). 

    // Start the server with suppressed logging.
    require('./server')(true);

    // After model is synced, run the tests.
    emitter.once('model-synced', function () {
        require('./test');
        emitter.once('tests-done', function () {
            // Stop the process which terminates the server (index.js).
            process.exit();
        });
    });

});