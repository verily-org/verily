var specificAnswer = require('./answers').specific;

//specific answercomment has this path fragment.

exports.specific = specificAnswer + '/comment/:comment_id';
var specific = exports.specific;

exports.route = function (app, controllers, doc) {
    var route = require('../route')(app, controllers, doc, __filename);

    route('post', specificAnswer + '/comments', 'create', 'Create;Add new comment to answer');

    route('get', specificAnswer + '/comments', 'all', 'Get All; Get all comments of answer');

    route('get', specific, 'get', 'Get;Get answer comment with specific ID');

    route('put', specific, 'update', 'Update;Update comment of answer');

    route('delete', specific, 'remove', 'Delete; Delete comment of answer');

    route('head', specific, 'head', 'Head; Get headers for testing validity, accessibility, and recent modification');
};