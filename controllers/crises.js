var generic = require('./generic');
var enums = require('../enums');
var swig = require('swig');
var async = require('async');
var utils = require('utilities');
var s3 = require('../s3');

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

//All Crisis
exports.all = function (req, res) {
    //Redirect to crisis/1 for Challenge purposes
    res.redirect('/crisis/1');
    res.end();
}

// Homepage
exports.index = function (req, res) {
    req.models.Crisis.find({}, 10,function (err, crises) {
        if (err) {
            generic.genericErrorHandler(req, res, err);
        } else {
            res.status(200);
            if (req.user){var user = req.user; }
            
            var cookieMessageSeen = true;
            
            if (!req.session.hasOwnProperty('cookieMessageSeen') || !req.session.cookieMessageSeen) {
                // Cookie message not seen yet.
                cookieMessageSeen = false;
                // True because they will have seen the cookie message upon this response
                // so that on next request cookieMessageSeen will return as true.
                req.session.cookieMessageSeen = true;
            }


            var imageURL = 'https://s3-eu-west-1.amazonaws.com/' + s3.BUCKET_ID + '/images/verily_banner1200x627.png';
                        
            //res.json(crises);
            res.render('generic/index', {
                page: {

                },
                path: '/',
                crises: crises,
                user: user,
                cookieMessageSeen: cookieMessageSeen,
                imageURL: imageURL,
                info: req.flash('info'),
                error: req.flash('error'),
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

//get a specific crisis
exports.get = function (req, res) {
    //Redirection if different than 1 for Challenge purpose
    if(req.params.crisis_id != 1){
        res.redirect('/crisis/1');
        res.end();
    }
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