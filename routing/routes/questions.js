// Specific question has this path fragment.

var specificCrisis = require('./crises').specific;
exports.specific = specificCrisis + '/question/:question_id';
var specific = exports.specific;

exports.route = function (app, controllers, doc) {
    var route = require('../route')(app, controllers, doc, __filename);

    //View all the questions
    route('get','/question', 'all', 'Get All; Get all questions');
    // View to create question
    route('get', specificCrisis + '/question/create', 'create', 'Create View; View to create question');
    
    // Create question API endpoint
    route('post', specificCrisis + '/question', 'new', 'New; New question');

    // Mark question as important
    route('post', specific + '/markImportant', 'markImportant', 'Mark as Important');

    route('get', specific, 'get', 'Get; Get question with specific ID');
    
    // View to edit question
    route('get', specific + '/edit', 'edit', 'Edit View; View to edit question');

    // API endpoint to update question
    route('put', specific, 'update', 'Update; Update question');

    route('delete', specific, 'remove', 'Delete; Delete question');

    route('get', specificCrisis, 'index', 'Index; Spotlight: returns up to 10 questions with their answers');

    route('head', specific, 'head', 'Head; Get headers for testing validity, accessibility, and recent modification');

};