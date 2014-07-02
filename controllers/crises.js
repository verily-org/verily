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

var checkRole = role.can('create a crisis');

exports.create = [checkRole, createCrisis];

//create new crisis
var newCrisis = function (req, res) {
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
var checkRole = role.can('create a crisis');
exports.new = [checkRole, newCrisis];



//get 10 last crises
exports.index = function (req, res) {
    req.models.Crisis.find({}, 10,function (err, crises) {
        if (err) {
            generic.genericErrorHandler(req, res, err);
        } else {
            res.status(200);
            if (req.user){var user = req.user; }
            //res.json(crises);
            res.render('generic/index', {
                page: {

                },
                path: '/',
                crises: crises,
                user: user,
                info: req.flash('info'),
                error: req.flash('error')
            });
        }
    });
};

exports.about = function (req, res) {
    res.status(200);
    if (req.user){var user = req.user; }
    res.render('generic/about', {
        page: {
        },
        path: '/about',
        user: user,
        info: req.flash('info'),
        error: req.flash('error')
    });
};



//get the challenge welcome page
// exports.challenge = function (req, res) {
//     res.status(200);
//     if (req.user){var user = req.user; }
//     //res.json(crises);
//     res.render('crisis/challenge', {
//         page: {
//
//         },
//         user: user,
//         info: req.flash('info'),
//         error: req.flash('error')
//     });
// };


//post to challenge_email
exports.challenge_email = function (req, res) {
    //todo: Save email, return to welcome page with feedback
//    req.models.InterestedUsers.create([req.body.email], function(err){
//
//        if(!err){
//            res.status(200);
//            res.send();
//        } else {
//            generic.genericErrorHandler(req, res, err);
//        }
//    });
};
//get a specific crisis
exports.get = function (req, res) {
    generic.get(req.models.Crisis, req.params.crisis_id, undefined, function (err, crisis) {
        
        if (!err){
            crisis.getQuestions({}, function (err, questions) {
                if (err) {
                    generic.genericErrorHandler(req, res, err);
                } else {
                    // Questions with Post data included in each question.
                    async.each(questions, generic.load_question_extra_fields, function (err) {
                        if (err) {
                            generic.genericErrorHandler(req, res, err);
                        } else {
                            crisis.post.addViewCount();
                            generic.load_crisis_extra_fields(crisis, function(err){
                                if (req.user){var user = req.user; }
                                
                                // For each question, add relative created date.
                                questions.forEach(function(question) {
                                    var relativeCreatedDate = utils.date.relativeTime(question.post.date, {abbreviated: true});
                                    question.relativeCreatedDate = relativeCreatedDate;
                                })
                                
                                var relativeCreatedDate = utils.date.relativeTime(crisis.post.date, {abbreviated: true});
                                crisis.relativeCreatedDate = relativeCreatedDate;
                                
                                res.render('crisis/one', {
                                    crisis: crisis,
                                    questions: questions,
                                    user: user,
                                    page: {
                                        title: crisis.post.title
                                    }
                                });
                            });
                        }
                    });
                }
            });
        }
        else{
            generic.genericErrorHandler(req, res, err);
        }
    });
};

// Mark crisis as Important
var markImportant = function (req, res) {
    generic.get(req.models.Crisis, req.params.crisis_id, undefined, function (err, crisis) {
        if (!err && crisis) {
            require('./ratings').importance(req, crisis.post, function(err, rating){
                generic.load_crisis_extra_fields(crisis, function(){
                    if(!err){
                        res.status(200);
                        res.json(crisis);
                    } else {
                        generic.genericErrorHandler(req, res, err);
                    }
                });
            });
        } else {
            generic.genericErrorHandler(req, res, err);
        }
    });
};
var checkRole = role.can('mark important');

exports.markImportant = [checkRole, markImportant];

// View to edit a crisis
var editCrisis = function (req, res) {
    generic.get(req.models.Crisis, req.params.crisis_id, undefined, function (err, crisis) {
        if (err) throw err;
            // No errors.
            res.status(200);

            // Goes into post object because
            // all fields are in Post and this allows
            // a generic form.
            if (req.user){var user = req.user; }
            res.render('crisis/edit', {
                crisis: crisis,
                post: crisis.post,
                page: {
                    title: 'Edit crisis'
                },
                user: user
        });
    });
}


var checkRole = role.can('edit a crisis');

exports.edit = [checkRole, editCrisis];

// Update crisis
var update = function (req, res) {
    var crisis_id = req.params.crisis_id;
    generic.get(req.models.Crisis, crisis_id, undefined, function (err, question) {
        if (!err && question) {
            generic.update(req.models.Crisis, crisis_id, req, function (err) {
                if (!err) {

                    res.redirect('/crisis/' + crisis_id);

                    res.end();
                } else {
                    generic.genericErrorHandler(req, res, err);
                }
            });
        } else {
            generic.genericErrorHandler(req, res, err);
        }

    });

};


var checkRole = role.can('edit a crisis');

exports.update = [checkRole, update];