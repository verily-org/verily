exports.specific = '/user/:user_id';
var specific = exports.specific;
exports.route = function (app, controllers, doc) {
    var route = require('../route')(app, controllers, doc, __filename);
    
    
    // View to register
    route('get', '/register', 'registerView', 'register view');
    route('get', '/login', 'loginView', 'login view');
    route('post', '/login', 'login', 'login user');
    route('get', '/logout', 'logoutView', 'logout user');
    route('get', '/logout-done', 'logoutDone', 'logout completed');
    
    route('post', '/user', 'register', 'New; New user');

    route('get', '/user', 'profile', 'Get the profile of the user');

    route('get', '/auth/facebook', 'facebookRedirect', 'Authenticate Facebook user');
    route('get', '/auth/facebook/callback', 'facebookAuthenticate', 'Authenticate Facebook user');

    route('get', '/auth/twitter', 'twitterRedirect', 'Authenticate Twitter user');
    route('get', '/auth/twitter/callback', 'twitterAuthenticate', 'Authenticate twitter user');

    route('get', '/chooseUsername', 'chooseUsernameView', 'View for facebook and twitter users to choose their username');
    route('post', '/username', 'chooseUsername', 'Assign a username for fb and twitter user'); 

    route('get', '/roles', 'getRoles', 'Get page for user roles');
    route('post', '/roles', 'changeRoles', 'Change the roles of the users');
    route('get', '/adminAnswers', 'getAdminAnswers', 'Get all the answers for the admin page');
    route('post', '/adminAnswers', 'postAdminAnswers', 'Post answers that should be hidden');

    route('get', '/banUser', 'getBanUsers', 'Get User ban view');
    route('get', specific + '/userContentList', 'getUserContentList', 'Get all the answers for the admin page');
    route('post', '/banUser', 'postBanUser', 'Post to Ban a specific user');
    route('post', '/hideUserEvidence', 'postHideUserEvidence', 'Post user that should have all answers hidden');

    route('get', '/changePass', 'passChangeView', 'Get view to change the password');
    route('post', '/changePass', 'passChange', 'Change user\'s password');

    route('get', '/forgot', 'forgotView', 'Get the view to request password reset');
    route('post', '/forgot', 'forgot', 'Send an email to user to reset password');
    route('get', '/reset/:token', 'resetView', 'get view to reset password');
    route('post', '/reset', 'reset', 'reset password');

    route('get', '/verify/:token', 'verifyAccount', 'Verify user account');
};