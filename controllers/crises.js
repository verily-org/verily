var generic = require('./generic');
var enums = require('../enums');
var swig = require('swig');
var async = require('async');
var utils = require('utilities');
var mode = require('../mode');
var memwatch = require('memwatch');
var query = require('../lib/sqlQueries');

var common = require('../static/js/common');
var userController = require('./users');

var role = require('../lib/roles').user;
var hd;
var trueValue;
var falseValue;
if (mode.isHeroku() || process.env.DATABASE === 'postgres') {
    trueValue = true;
    falseValue = false;
} else {
    trueValue = 1;
    falseValue = 0;
}


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
            console.log('ERROR: '+err);
            generic.genericErrorHandler(req, res, err);
        }
    });
};
var checkRole = role.can('create a crisis');
exports.new = [checkRole, newCrisis];

// All Crises
var all = function (req, res) {
    //Redirect to crisis/1 for Challenge purposes
    res.redirect('/crisis/1');
    res.end();
}
exports.all = [role.can('view challenge pages'), all];

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
                        
            //res.json(crises);
            res.render('generic/index', {
                page: {

                },
                path: '/',
                crises: crises,
                user: user,
                cookieMessageSeen: cookieMessageSeen,
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

exports.terms = function (req, res) {
    res.status(200);
    if (req.user){var user = req.user; }
    res.render('generic/terms', {
        page: {
        },
        path: '/terms',
        user: user,
        info: req.flash('info'),
        error: req.flash('error')
    });
};

exports.help = function (req, res) {
    res.status(200);
    if (req.user){var user = req.user; }
    res.render('generic/help', {
        page: {
        },
        path: '/help',
        user: user,
        info: req.flash('info'),
        error: req.flash('error')
    });
};

var oneCrisisResponse = function(req, res, responseData) {
    res.render('crisis/one', responseData);
}

//get a specific crisis
var getOne = function (req, res) {
    memwatch.gc();
    /*var datetime = new Date();
    console.log('-----Entered crisis-----' + datetime.getMinutes()+":"+datetime.getSeconds() );*/
    generic.get(req, req.models.Crisis, req.params.crisis_id, undefined, function (err, crisis) {
        if (!err){
            
            query.findAllQuestionsOfACrisis(req, crisis.id, function (err, questions) {
                    
                    if (err) {
                        generic.genericErrorHandler(req, res, err);
                    } else {
                        /*var datetime = new Date();
                        console.log('-----Question Found-----' + datetime.getMinutes()+":"+datetime.getSeconds() );*/
                        // Questions with Post data included in each question.
                        async.each(questions, query.load_question_extra_fields.bind(null, req), function (err) {
                            if (err) {
                                generic.genericErrorHandler(req, res, err);
                            } else {
                                crisis.post.addViewCount();
                                generic.load_crisis_extra_fields(crisis, function(err){
                                    // For each question, add relative created date.
                                    
                                    var relativeCreatedDate = utils.date.relativeTime(crisis.post.date, {abbreviated: true});
                                    crisis.relativeCreatedDate = relativeCreatedDate;

                                    generic.generateRefCodes(4, function(refcodeArray) {
                                        var refcodes = {
                                            twitter: refcodeArray[0],
                                            facebook: refcodeArray[1],
                                            email: refcodeArray[2],
                                            link: refcodeArray[3]
                                        };
                                        
                                        var responseData = {
                                            crisis: crisis,
                                            questions: questions,
                                            page: {
                                                title: crisis.post.title
                                            },
                                            path: req.path,
                                            refcodes: refcodes,
                                            info: req.flash('info'),
                                            error: req.flash('error')
                                        };
                                        if (req.user) {

                                            /*var datetime = new Date();
                                            console.log('-----Responding crisis-----' + datetime.getMinutes()+":"+datetime.getSeconds() );*/
                                            responseData.user = req.user;
                                            // Respond.
                                            oneCrisisResponse(req, res, responseData);
                                        } else {
                                            // User is not currently logged in --
                                            // let's make them a provisional account
                                            // so they can immediately do stuff.
                                            userController.newProvisionalUser(req, function(err, user) {
                                                // Provisional user account created.
                                                // Respond.
                                                responseData.user = user;
                                                oneCrisisResponse(req, res, responseData);
                                            });   
                                        }
                                    
                                    });

                                });
                            }
                        });
                    }
                //});
            });
                
        }
        else{
            generic.genericErrorHandler(req, res, err);
        }
    });
};

exports.get = [role.can('view challenge pages'), getOne];

// Mark crisis as Important
var markImportant = function (req, res) {
    generic.get(req.models.Crisis, req.params.crisis_id, undefined, function (err, crisis) {
        if (!err && crisis) {
            require('./ratings').importance(req, crisis.post, function(err, rating){
                generic.load_crisis_extra_fields(crisis, function(){
                    if(!err){
                        res.status(200);
                        // res.json(crisis);
                        res.end();
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
    generic.get(req, req.models.Crisis, req.params.crisis_id, undefined, function (err, crisis) {
        if (err) {
            throw err;
        }
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
    generic.get(req, req.models.Crisis, crisis_id, undefined, function (err, question) {
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