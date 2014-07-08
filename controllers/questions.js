var generic = require('./generic');
var enums = require('../enums');
var swig = require('swig');
var async = require('async');
var utils = require('utilities');
var oembed = require('oembed');

var common = require('../static/js/common');

var userController = require('./users');
var role = require('../lib/roles').user;

// Enables discovery of questions – this is the questions spotlight.
exports.index = function (req, res) {
    res.redirect('/');
    res.end();
};


// Get all questions.
exports.all = function (req, res) {

    // req.models.Question.find({}, function (err, questions) {
    //     if (err) {
    //         generic.genericErrorHandler(req, res, err);
    //     } else {
    //         res.status(200);
    //         if (req.user){var user = req.user; }
    //         //res.json(crisis);
    //         res.render('question/index', {
    //             page: {
    //                 title: 'Verily questions'
    //             },
    //             questions: questions,
    //             user: user
    //         });
    //     }
    // });
    
    res.redirect('/');
    res.end();
};

// View to add question
var createQuestion = function (req, res) {
    res.status(200);
    if (req.user){var user = req.user; }
    generic.get(req.models.Crisis, req.params.crisis_id, undefined, function (err, crisis) {
        if (err) throw err;
        res.render('question/create', {
            page: {
                title: 'Add question'
            },
            crisis: crisis,
            user: user
        });
    });
}

var checkRole = role.can('create a question');

exports.create = [checkRole, createQuestion];

// View to add multiple questions
var create_multiple_questions = function (req, res) {
    res.status(200);
    if (req.user){var user = req.user; }
    generic.get(req.models.Crisis, req.params.crisis_id, undefined, function (err, crisis) {
        if (err) throw err;
        res.render('question/createMultiple', {
            page: {
                title: 'Add multiple questions'
            },
            crisis: crisis,
            user: user
        });
    });
}

var checkRole = role.can('create multiple questions');

exports.createQuestions = [checkRole, create_multiple_questions];

// Add multiple questions
var new_questions = function (req, res) {
    res.status(200);
    if (req.user){var user = req.user; }
    generic.get(req.models.Crisis, req.params.crisis_id, undefined, function (err, crisis) {
        if (err) throw err;

        var fs = require('fs');
        var file = req.body.file;

        fs.readFile(file, function(err, data){
            if (err) {
                console.error('File read error: ' + err);
                res.render('question/createMultiple', {
                    page: {
                        title: 'Add multiple questions'
                    },
                    crisis: crisis,
                    error: 'Unable to open file on URL: "' + file + '"'
                });
                return;
            }
            var data = JsonObjToArray(JSON.parse(data));
            async.eachSeries(data,
                function(question, callback){
                    //Prepare data
                    if(question.targetDateTimeOccurred){
                        var date = new Date(question.targetDateTimeOccurred);
                    }
                    else{
                        var date = new Date();
                       }
                    req.body.formSelectImage = "link";
                    req.body.targetDateTimeOccurred = [date.getDate(), (date.getMonth()+1), date.getFullYear(), date.getHours(), date.getMinutes()];

                    if(!question.title || question.title == ""){
                        callback("Title needed on question: " + question.key);
                        return;
                    }
                    req.body.title = question.title;
                    req.body.text = question.text;
                    req.body.targetImageUrl = question.targetImage;
                    req.body.targetVideoUrl = question.targetVideoUrl;
                    req.body.targetLocality = question.targetLocality;
                    req.body.targetLat = question.targetLat;
                    req.body.targetLong = question.targetLong;
                    req.body.tags = question.tags;
                    req.body.automaticLocation = question.automaticLocation;

                    generic.create(req.models.Question, {}, req, function (err, question) {
                        if (!err && question) {
                            question.setCrisis(crisis, function (err) {
                                if (err) throw err;
                                generic.get(req.models.Question, question.id, undefined, function (err, question2) {
                                    if (!err && question2) {
                                        callback();
                                    } else {
                                        callback(err);
                                        //special err: if 404 then it means the create just executed is invalid.

                                    }
                                });
                            });
                        } else {
                            callback(err);
                        }
                    });
                }, function(err){
                    if (err) {
                        res.status(500);
                        res.end('Error 500: Server Error - '+ err);
                        console.r.error(req, 500, err);
                    }
                    else{
                        res.redirect('/crisis/' + req.params.crisis_id);
                        res.end();
                    }
                });

        });

    });
}

var checkRole = role.can('create multiple questions');

exports.newQuestions = [checkRole, new_questions];

// View to edit a question
var editQuestion = function (req, res) {
    generic.get(req.models.Crisis, req.params.crisis_id, undefined, function (err, crisis) {
        if (err) throw err;
        getQuestion(req, false, function(err, question) {
            if (err) {
                // Error!
                generic.genericErrorHandler(req, res, err);
            } else {
                // No errors.            
                res.status(200);
                
                // Goes into post object because
                // all fields are in Post and this allows
                // a generic form.
                if (req.user){var user = req.user; }
                res.render('question/edit', {
                    crisis: crisis,
                    post: question.post,
                    question: {
                        id: question.id
                    },
                    page: {
                        title: 'Edit question'
                    },
                    user: user
                });
            }
        });
    });
}

var checkRole = role.can('edit a question');

exports.edit = [checkRole, editQuestion];

// Used by get, edit functions etc.
var getQuestion = function (req, addView, callback) {
    // ETag support.
    var reqIfNoneMatch = req.get(enums.ifNoneMatch) || null;

    generic.get(req.models.Question, req.params.question_id, reqIfNoneMatch, function (err, question) {
        if (!err && question) {
            
            var relativeCreatedDate = utils.date.relativeTime(question.post.date, {abbreviated: true});
            
            var relativeTargetDateTimeOccurred = generic.relativeTime(question.post.targetDateTimeOccurred);
    
            
            if(addView){
                question.post.addViewCount();
            }
            
            question.getAnswers(function (err, answers) {
               if (!err && answers) {
                    var answersShown = [];
                    for (var i = 0; i < answers.length; i++) {
                        if (answers[i].show)
                            answersShown.push(answers[i]);
                    }

                   generic.load_question_extra_fields(question, function(err){
                       if (!err) {
                           var questionTmp = {
                               title: question.post.title,
                               id: question.id,
                               text: question.post.text,
                               targetLocality: question.post.targetLocality,
                               targetLat: question.post.targetLat,
                               targetLong: question.post.targetLong,
                               targetImage: question.post.targetImage,
                               targetYoutubeVideoId: question.post.targetYoutubeVideoId,
                               targetYoutubeVideoUrl: question.post.targetYoutubeVideoUrl,
                               targetDateTimeOccurred: question.post.targetDateTimeOccurred,
                               relativeTargetDateTimeOccurred: relativeTargetDateTimeOccurred,
                               date: question.post.date,
                               relativeCreatedDate: relativeCreatedDate,
                               author: question.post.author,
                               tags: question.post.tags,
                               viewCount: question.post.viewCount,
                               rejectedAnswerCount: question.rejectedAnswerCount,
                               supportedAnswerCount: question.supportedAnswerCount,
                               updated: question.post.updated,
                               importanceCount: question.importanceCount,
                               post: question.post
                           }, wrapper = {
                               question: questionTmp
                           };
                           // Answers present.

                           async.each(answersShown, generic.load_answers_extra_fields, function (err) {
                               if (err) {
                                   callback(err);
                               } else {
                                   questionTmp.answers = answersShown;
                                   callback(err, questionTmp);
                               }
                           });
                       } else {
                           callback(err);
                       }

                    });
               } else {
                   callback(err);
               }
            });
            

        } else if (err === enums.NOT_MODIFIED) {
            callback(err);
        } else {
            callback(err);
        }

    });  
};

function oneQuestionResponse(req, res, crisis, question, user, refcodes){
    res.status(200);
    res.render('question/one', {
        crisis: crisis,
        question: question,
        page: {
            title: question.title
        },
        user: user,
        refcodes: refcodes,
        path: req.path
    });
}

// Creates a provisional user if the user is not logged in.
var applyUserAndRespond = function(req, res, crisis, question, refcodes) {
    if (req.user) {
        // User is currently logged in.
        oneQuestionResponse(req, res, crisis, question, req.user, refcodes);
    } else {
        // User is not currently logged in --
        // let's make them a provisional account
        // so they can immediately do stuff.
        userController.newProvisionalUser(req, function(err, user) {
            // Provisional user account created.
            // Respond.
            oneQuestionResponse(req, res, crisis, question, req.user, refcodes);
        });   
    }
};

// Get a specific question.
var getOne = function (req, res) {
    //get(req.models.Question, req.params.question_id, res, 200);
    generic.get(req.models.Crisis, req.params.crisis_id, undefined, function (err, crisis) {
        if (err) throw err;
        getQuestion(req, true, function(err, question) {
            if (err) {
                // Error!
                if (err === enums.NOT_MODIFIED) {
                    // 304 Not Modified.
                    res.status(304);
                    res.end();
                } else {
                    generic.genericErrorHandler(req, res, err);
                }
            } else {
                // No errors.
                
                // Set the ETag header.
                //res.set(enums.eTag, question.updated);
                
                generic.generateRefCodes(4, function(refcodeArray) {
                    var refcodes = {
                        twitter: refcodeArray[0],
                        facebook: refcodeArray[1],
                        email: refcodeArray[2],
                        link: refcodeArray[3]
                    };
                    
                    if(question.post.targetVideoUrl){
                        oembed.fetch(question.post.targetVideoUrl,{}, function(err, result){

                            if (!err){
                                question.post.targetVideoHtml = result.html;
                            } else {
                                question.post.VideoUrlNotEmbeddable = question.post.targetVideoUrl;
                            }


                            applyUserAndRespond(req, res, crisis, question, refcodes);
                        });
                    } else{
                        applyUserAndRespond(req, res, crisis, question, refcodes);
                    }
                });
                


            }
        });
    });
};

exports.get = [role.can('view challenge pages'), getOne];

exports.head = function (req, res) {
    res.redirect('/');
    res.end();
};

// Adds a question and responds with the created question.
var newOne = function (req, res) {
    // This is a POST request, so by default, fields go into the body.

    // only extra columns (apart from post) need to be written here
    var data = { 

    };
    var crisis_id = req.params.crisis_id;
    generic.get(req.models.Crisis, crisis_id, undefined, function (err, crisis) {
        if (err) throw err;
        generic.create(req.models.Question, data, req, function (err, question) {
            if (!err && question) {
                question.setCrisis(crisis, function (err) {
                    if (err) throw err;
                    generic.get(req.models.Question, question.id, undefined, function (err, question2) {
                        if (!err && question2) {
                            var wrapper = {
                                question: question2
                            };
                            // res.status(201);
                            //res.set(enums.eTag, question2.updated);
                            
                            // var redirect = common.formAbsoluteURI('/question/' + question2.id);
                            res.redirect('/crisis/' + crisis_id + '/question/' + question2.id);
                            //res.json(wrapper);
                            res.end();                   
                        } else {
                            //special err: if 404 then it means the create just executed is invalid.
                            res.status(500);
                            res.end('Error 500: Server Error');
                            console.r.error(req, 500, err);
                        }
                    });                    
                });    
            } else {
                generic.genericErrorHandler(req, res, err);
            }
        });
    });
};

exports.new = [role.can('create a question'), newOne];

// Update question
var update = function (req, res) {
    var crisis_id = req.params.crisis_id;
    generic.get(req.models.Question, req.params.question_id, undefined, function (err, question) {
        if (!err && question) {
            generic.update(req.models.Question, req.params.question_id, req, function (err) {
                if (!err) {
                    //204 no content
                    // res.status(204);
                    
                    res.redirect('/crisis/' + crisis_id + '/question/' + req.params.question_id);
                    
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


var checkRole = role.can('edit a question');

exports.update = [checkRole, update];

// Mark question as Importante
exports.markImportant = function (req, res) {

    generic.get(req.models.Question, req.params.question_id, undefined, function (err, question) {
        if (!err && question) {
                require('./ratings').importance(req, question.post, function(err, rating){
                    generic.load_crisis_extra_fields(question, function(){
                        if(!err){

                            res.status(200);
                            //Return question for ajax update
                            res.json(question);
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

// Delete question
var remove = function (req, res) {
    var afterRemove = function (err) {
        if (err) {
            generic.genericErrorHandler(req, res, err);
            throw err;
        }
    },
        afterGetComments = function (err, acomments) {
            if (!err) {
                var j;
                for (j in acomments) {
                    if (acomments.hasOwnProperty(j)) {
                        //start to delete acomments
                        generic.removeOne(acomments[j], req, afterRemove);
                    }
                }
                // acomments are deleted.
            } else {
                generic.genericErrorHandler(req, res, err);
                throw err;
            }
        };
    generic.get(req.models.Question, req.params.question_id, undefined, function (err, question) {
        if (!err && question) {
            question.getAnswers(function (err, answers) {
                if (!err && answers) {
                    var i;
                    for (i in answers) {
                        if (answers.hasOwnProperty(i)) {
                            answers[i].getComments(afterGetComments);
                            //start to delete answers
                            generic.removeOne(answers[i], req, afterRemove);
                            // answers are deleted.
                        }
                    }
                } else if (err.code !== 2) {
                    generic.genericErrorHandler(req, res, err);
                }

            });

            question.getComments(function (err, qcomments) {
                if (!err && qcomments) {
                    //start to delete qcomments
                    var k;
                    for (k in qcomments) {
                        if (qcomments.hasOwnProperty(k)) {
                            generic.removeOne(qcomments[k], req, afterRemove);
                        }
                    }
                    // qcomments are deleted.
                } else if (err.code !== 2) {
                    generic.genericErrorHandler(req, res, err);
                }
            });
            generic.removeOne(question, req, function (err) {
                if (!err) {
                    //FIXME: maybe not all realted items are deleted.
                    res.status(204);
                    res.end();
                } else {
                    generic.genericErrorHandler(req, res, err);
                    throw err;
                }
            });
        } else {
            generic.genericErrorHandler(req, res, err);
        }

    });
};

exports.remove = [role.can('edit a question'), remove];

function JsonObjToArray(jsonObj){
    var result = [];

    for(var i in jsonObj)
        result.push( jsonObj [i]);
    return result;
}