var specificQuestion = require('./questions').specific;

// Specific answer has this path fragment.
exports.specific = specificQuestion + '/answer/:answer_id';
var specific = exports.specific;

exports.route = function (app, controllers, doc) {
    var route = require('../route')(app, controllers, doc, __filename);

    route('post', specificQuestion + '/answers', 'create', 'Create; Add new answer to question');

    route('get', specificQuestion + '/answers', 'all', 'Get all answers for a specific question; Get all answers for a specific question');

    route('get', '/answers', 'allEver', 'Get All; Get all answers ever stored in the datastore');

    route('get', specific, 'get', 'Get; Get answer with specific ID');

    route('put', specific, 'update', 'Update; Update answer');

    route('delete', specific, 'remove', 'Delete; Delete answer');

    route('head', specific, 'head', 'Head; Get headers for testing validity, accessibility, and recent modification');
};