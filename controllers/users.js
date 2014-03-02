var generic = require('./generic');
var enums = require('../enums');
var swig = require('swig');
var async = require('async');
var passport = require('passport');
require('../lib/passport')(passport);

exports.profile = function (req, res) {
    if (req.user) {
        req.user.getLocal(function (err, local) {
            if (err) {throw err; }
            res.json(local);
        });
    } else {
    
    }
};
//Posts a new user
exports.register = passport.authenticate('local-register', {
    successRedirect : '/login', // redirect to the secure profile section
    failureRedirect : '/register', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
});

exports.registerView = function (req, res) {
    res.status(200);
    res.render('user/register', {
        page: {
            title: 'Register User'
        },
        message: req.flash('registerMessage')
    });
};

exports.loginView = function (req, res) {
    res.status(200);
    res.render('user/login', {
        page: {
            title: 'Login User',
        },
        message: req.flash('loginMessage')
    });
};

exports.login = passport.authenticate('local-login', {
    successRedirect : '/question', // redirect to the secure profile section
    failureRedirect : '/login', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
});

exports.logout = function (req, res) {
    req.logout();
    res.redirect('/question');
};

exports.facebookRedirect = passport.authenticate('facebook', {
    scope: 'email'
});

exports.facebookAuthenticate = passport.authenticate('facebook', {
    successRedirect : '/user', // redirect to the secure profile section
    failureRedirect : '/login', // redirect back to the signup page if there is an error
});