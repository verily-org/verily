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

var newsResponse = function(req, res, responseData) {
    res.render('crisis/news', responseData);
}

exports.news = function(req, res) {
            
            query.getNews(req, function (err, questions) {
                    
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
                                //generic.load_crisis_extra_fields(crisis, function(err){
                                    // For each question, add relative created date.
                                    
                                    
                                    generic.generateRefCodes(4, function(refcodeArray) {
                                        var refcodes = {
                                            twitter: refcodeArray[0],
                                            facebook: refcodeArray[1],
                                            email: refcodeArray[2],
                                            link: refcodeArray[3]
                                        };
                                        
                                        var responseData = {
                                            questions: questions,
                                            page: {
                                                title: "News"
                                            },
                                            path: req.path,
                                            refcodes: refcodes,
                                            info: req.flash('info'),
                                            error: req.flash('error')
                                        };
                                        if (req.user) {
                                            

                                            var datetime = new Date();
                                            /*console.log('-----Responding crisis-----' + datetime.getMinutes()+":"+datetime.getSeconds() );*/
                                            req.models.User.get(req.user.id, function(err, user) {
                                                user.lastVisit = new Date();
                                                user.save(function(err) { console.log(err); });
                                            });
                                            responseData.user = req.user;
                                            // Respond.
                                            newsResponse(req, res, responseData);
                                        } else {
                                            // User is not currently logged in --
                                            // let's make them a provisional account
                                            // so they can immediately do stuff.
                                            userController.newProvisionalUser(req, function(err, user) {
                                                // Provisional user account created.
                                                // Respond.
                                                responseData.user = user;
                                                newsResponse(req, res, responseData);
                                            });   
                                        }
                                    
                                    });

                                //});
                            }
                        });
                    }
                //});
            });
                
    
}

