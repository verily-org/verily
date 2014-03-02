exports.route = function (app, controllers, doc) {
    var route = require('../route')(app, controllers, doc, __filename);
    
    
    // View to register
    route('get', '/register', 'registerView', 'register view');
    route('get', '/login', 'loginView', 'login view');
    route('post', '/login', 'login', 'login user');
    route('get', '/logout', 'logout', 'logout user');
    
    route('post', '/user', 'register', 'New; New user');

    route('get', '/user', 'profile', 'Get the profile of the user');

    route('get', '/auth/facebook', 'facebookRedirect', 'Authenticate Facebook user');
    route('get', '/auth/facebook/callback', 'facebookAuthenticate', 'Authenticate Facebook user');
};