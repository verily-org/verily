var events = require('events');
var emitter;

// Event emitter singleton
module.exports = function () {
    if (!emitter) {
        emitter = new events.EventEmitter();
    }
    return emitter;
};