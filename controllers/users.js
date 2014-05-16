var generic = require('./generic');
var enums = require('../enums');
var swig = require('swig');
var async = require('async');
var passport = require('passport');
require('../lib/passport')(passport);

exports.profile = function (req, res) {
    if (req.user) {
        var userData = {
            name: req.user.name,
            id: req.user.id
        }
        res.json(userData);
    } else {
        // Not logged in.
        res.redirect('/login/');
    }
};
//Posts a new user
exports.register = passport.authenticate('local-register', {
    successRedirect : 'back', // redirect to the page they were on
    failureRedirect : '/register', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
});

exports.logoutDone = function (req, res) {
    if (!req.user) {
        // No user -- logged out.
        res.status(200);
        res.render('user/logout-done', {
            page: {
                title: 'Logged out'
            }
        });
    } else {
        // They visited this page manually but are still logged in, 
        // or logged in again from this page ('back' functionality)
        res.redirect('/');
    }
};

exports.registerView = function (req, res) {
    if (!req.user) {
        res.status(200);
        res.render('user/register', {
            page: {
                title: 'Signup'
            },
            message: req.flash('registerMessage')
        });
    } else {
        // Logged out or signed up from canonical signup form (rather than an inline form)
        res.redirect('/');
    }
    
};

exports.loginView = function (req, res) {
    if (!req.user) {
        res.status(200);
        res.render('user/login', {
            page: {
                title: 'Login',
            },
            message: req.flash('loginMessage')
        });
    } else {
        // If they are already logged in,
        // don't let them log in again!
        // This is also used when login to make the 'back' redirect behaviour work.
        res.redirect('/');
    }

};

exports.login = passport.authenticate('local-login', {
    successRedirect : 'back', // redirect to the page they were on
    failureRedirect : '/login', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
});

exports.logout = function (req, res) {
    req.logout();
    res.redirect('/logout-done');
};

exports.facebookRedirect = passport.authenticate('facebook', {
    scope: 'email'
});

exports.facebookAuthenticate = passport.authenticate('facebook', {
    successRedirect : 'back', // redirect to the secure profile section
    failureRedirect : '/login', // redirect back to the signup page if there is an error
});