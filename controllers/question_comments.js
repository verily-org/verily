//Controller for QuestionComment
var generic = require('./generic');
var enums = require('../enums');

var async = require('async');

exports.get = function (req, res) {
    res.redirect('/');
    res.end();
};

exports.head = function (req, res) {

    res.redirect('/');
    res.end();
};

//get all comments for a question
exports.all = function (req, res) {
    res.redirect('/');
    res.end();
};

// Add comment to question
exports.create = function (req, res) {
    res.redirect('/');
    res.end();
};



//Update question comment
exports.update = function (req, res) {
    res.redirect('/');
    res.end();
};

//Delete 1 question comment
exports.remove = function (req, res) {
    res.redirect('/');
    res.end();
};