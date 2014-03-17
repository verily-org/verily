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
    if (req.user){var user = req.user; }
    res.render('crisis/create', {
        page: {
            title: 'Add Crisis'
        },
        user: user
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
            res.redirect('/crisis/' + crisis.id);
            res.end();
        } else {
            generic.genericErrorHandler(req, res, err);
        }
    });

};


//get 10 last crises
exports.index = function (req, res) {
    req.models.Crisis.find({}, 10,function (err, crises) {
        if (err) {
            generic.genericErrorHandler(req, res, err);
        } else {
            res.status(200);
            if (req.user){var user = req.user; }
            //res.json(crises);
            res.render('crisis/index', {
                page: {
                    title: 'Verily'
                },
                crises: crises,
                user: user
            });
        }
    });

};
//get a specific crisis
exports.get = function (req, res) {
    generic.get(req.models.Crisis, req.params.crisis_id, undefined, function (err, crisis) {
        if (err) throw err;
        crisis.getQuestions({}, function (err, questions) {
            if (err) {
                generic.genericErrorHandler(req, res, err);
            } else {
                // Questions with Post data included in each question.
                async.each(questions, generic.load_question_extra_fields, function (err) {
                    if (err) {
                        generic.genericErrorHandler(req, res, err);
                    } else {
                        // Wrap up the questions in a 'questions' property.
                        var wrapper = {
                            questions: questions
                        };
                        if (req.user){var user = req.user; }
                        res.render('crisis/one', {
                            crisis: crisis,
                            questions: questions,
                            user: user
                        });
                    }
                });
            }
        });
    });

};
