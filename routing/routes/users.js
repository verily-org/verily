exports.route = function (app, controllers, doc) {
    var route = require('../route')(app, controllers, doc, __filename);
    
    
    // View to register
    route('get', '/register', 'registerView', 'register view');
    route('get', '/login', 'loginView', 'login view');
    route('post', '/login', 'login', 'login user');
    route('get', '/logout', 'logout', 'logout user');
    route('get', '/logout-done', 'logoutDone', 'logout completed');
    
    route('post', '/user', 'register', 'New; New user');

    route('get', '/user', 'profile', 'Get the profile of the user');

    route('get', '/auth/facebook', 'facebookRedirect', 'Authenticate Facebook user');
    route('get', '/auth/facebook/callback', 'facebookAuthenticate', 'Authenticate Facebook user');

    route('get', '/admin', 'getAdminPage', 'Get administrator page');
    route('post', '/admin', 'changeRoles', 'Change the roles of the users');

    route('get', '/changePass', 'passChangeView', 'Get view to change the password');
    route('post', '/changePass', 'passChange', 'Change user\'s password');

    route('get', '/forgot', 'forgotView', 'Get the view to request password reset');
    route('post', '/forgot', 'forgot', 'Send an email to user to reset password');
    route('get', '/reset/:token', 'resetView', 'get view to reset password');
    route('post', '/reset', 'reset', 'reset password');

    route('get', '/verify/:token', 'verifyAccount', 'Verify user account');
};