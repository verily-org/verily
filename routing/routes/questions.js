// Specific question has this path fragment.
exports.specific = '/question/:question_id';
var specific = exports.specific;

exports.route = function (app, controllers, doc) {
    var route = require('../route')(app, controllers, doc, __filename);
    
    
    // View to create question
    route('get', '/question/create', 'create', 'Create View; View to create question');
    
    // Create question API endpoint
    route('post', '/question', 'new', 'New; New question');

    // View to edit question
    route('get', specific + '/markImportant', 'markImportant', 'Mark as Important');

    route('get', '/question', 'all', 'Get All; Get all questions');

    route('get', specific, 'get', 'Get; Get question with specific ID');
    
    // View to edit question
    route('get', specific + '/edit', 'edit', 'Edit View; View to edit question');

    // API endpoint to update question
    route('put', specific, 'update', 'Update; Update question');

    route('delete', specific, 'remove', 'Delete; Delete question');

    route('get', '/', 'index', 'Index; Spotlight: returns up to 10 questions with their answers');

    route('head', specific, 'head', 'Head; Get headers for testing validity, accessibility, and recent modification');

};