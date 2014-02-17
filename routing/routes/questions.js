// Specific question has this path fragment.
exports.specific = '/question/:question_id';
var specific = exports.specific;

exports.route = function (app, controllers, doc) {
    var route = require('../route')(app, controllers, doc, __filename);

    route('post', '/questions', 'create', 'Create; Create question');

    route('get', '/questions', 'all', 'Get All; Get all questions');

    route('get', specific, 'get', 'Get; Get question with specific ID');

    route('put', specific, 'update', 'Update; Update question');

    route('delete', specific, 'remove', 'Delete; Delete question');

    route('get', '/', 'index', 'Index; Spotlight: returns up to 10 questions with their answers');

    route('head', specific, 'head', 'Head; Get headers for testing validity, accessibility, and recent modification');

};