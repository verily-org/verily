var specificQuestion = require('./questions').specific;

//specific quesitoncomment has this path fragment.
exports.specific = specificQuestion + '/comment/:comment_id';
var specific = exports.specific;

exports.route = function (app, controllers, doc) {
    var route = require('../route')(app, controllers, doc, __filename);

    route('post', specificQuestion + '/comments', 'create', 'Create; Add new comment to question');

    route('get', specificQuestion + '/comments', 'all', 'Get All; Get all comments of question');

    route('get', specific, 'get', 'Get; Get question comment with specific ID');

    route('put', specific, 'update', 'Update; Update comment of question');

    route('delete', specific, 'remove', 'Delete; Delete comment of question');

    route('head', specific, 'head', 'Head; Get headers for testing validity, accessibility, and recent modification');
};