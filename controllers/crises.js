var generic = require('./generic');
var enums = require('../enums');
var swig = require('swig');
var async = require('async');
var utils = require('utilities');

var common = require('../static/js/common');

var role = require('../lib/roles').user;

// View to create crisis
var createCrisis = function (req, res) {
    res.status(200);
    if (req.user){var username = req.user.name; }
    res.render('crises/create', {
        page: {
            title: 'Add Crisis'
        },
        user: username
    });
}

var checkRole = role.can('create crisis');

exports.create = [checkRole, createCrisis];

//create new crisis
exports.new = function (req, res) {
    // This is a POST request, so by default, fields go into the body.

    // only extra columns (apart from post) need to be written here
    var data = { 

    };
    generic.create(req.models.Crisis, data, req, function (err, crisis) {
        if (!err && crisis) {
            res.redirect('/crisis/' + crisis.id + '/question');
            res.end();
        } else {
            generic.genericErrorHandler(req, res, err);
        }
    });

};