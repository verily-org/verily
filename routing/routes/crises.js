exports.specific = '/crisis/:crisis_id';
var specific = exports.specific;

exports.route = function (app, controllers, doc) {
    var route = require('../route')(app, controllers, doc, __filename);
    // View to create crisis
    route('get', '/crisis/create', 'create', 'Create View; View to create crisis');
    
    // Create crisis API endpoint
    route('post', '/crisis', 'new', 'New; New crisis');

    route('post', specific + '/markImportant', 'markImportant', 'Mark as Important');

    route('get', '/crisis', 'all', 'Get All; Get all crisis');

    route('get', specific, 'get', 'Get; Get crisis with specific ID');
    
    route('get', '/news', 'news', 'Get news');
    
    // View to edit crisis
    route('get', specific + '/edit', 'edit', 'Edit View; View to edit crisis');

    // API endpoint to update crisis
    route('post', specific, 'update', 'Update; Update crisis');

    route('delete', specific, 'remove', 'Delete; Delete crisis');

    route('get', '/', 'index', 'Index; Spotlight: returns up to 10 crisis');
    
    route('get', '/about', 'about', 'About; About Verily');

    route('get', '/terms', 'terms', 'Terms; Terms and conditions of Verily');

    route('get', '/challenge', 'challenge', 'Welcome page to the challenge');

    route('get', '/help', 'help', 'Get help View');

    // Use if it is decided to separate the help link into getInvolved and Guide
    //route('get', '/getInvolved', 'getInvolved', 'Get Involved view');
};