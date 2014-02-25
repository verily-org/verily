var generic = require('./generic');
var enums = require('../enums');
var swig = require('swig');
var async = require('async');
var utils = require('utilities');

// Enables discovery of questions – this is the questions spotlight.
exports.index = function (req, res) {
    req.models.Question.find({}, 10, function (err, questions) {
        if (err || !questions || questions.length === 0) {
            if (!questions || questions.length === 0) {
                err = {};
                err.code = 2;
            }
            generic.genericErrorHandler(req, res, err);
        } else {
            // Questions with Post data included in each question. 
            var indexGen = function indexGen(q, callback) {
                q.getAnswers(function (err, answers) {
                    if (!err && answers) {
                        async.each(answers, generic.gen, function (err) {
                            if (!err) {
                                q.getPost(function (err, post) {
                                    if (!err) {
                                        generic.join(q, post);
                                        callback();
                                    } else {
                                        generic.genericErrorHandler(req, res, err);
                                        throw err;
                                    }
                                });
                                q.answers = answers;
                            } else {
                                generic.genericErrorHandler(req, res, err);
                                throw err;
                            }
                        });
                    } else if (err.code !== 2 || answers) { //special consideration,because no answer for a question is normal
                        generic.genericErrorHandler(req, res, err);
                        throw err;
                    }
                });

            };
            async.each(questions, indexGen, function (err) {
                if (err) {
                    generic.genericErrorHandler(req, res, err);
                } else {
                    // Wrap up the questions in a 'questions' property.
                    var wrapper = {
                        questions: questions
                    };
                    res.json(wrapper);
                    res.end();
                }
            });
        }
    });
};

// Get all questions.
exports.all = function (req, res) {
    req.models.Question.find({}, function (err, questions) {
        if (err || !questions || questions.length === 0) {
            if (!questions || questions.length === 0) {
                err = {};
                err.code = 2;
            }
            generic.genericErrorHandler(req, res, err);
        } else {
            // Questions with Post data included in each question.  
            async.each(questions, generic.gen, function (err) {
                    console.log(questions);
                if (err) {
                    generic.genericErrorHandler(req, res, err);
                } else {
                    // Wrap up the questions in a 'questions' property.
                    var wrapper = {
                        questions: questions
                    };
                    res.render('question/index', {
                        questions: questions
                    });
                }
            });
        }
    });
};

// View to add question
exports.create = function (req, res) {
    res.status(200);
    res.render('question/create', {
        page: {
            title: 'Add question'
        }
    });
}

// View to edit a question
exports.edit = function (req, res) {
    
    getQuestion(req, function(err, question) {
        if (err) {
            // Error!
            generic.genericErrorHandler(req, res, err);
        } else {
            // No errors.            
            res.status(200);
            
            // Goes into post object because
            // all fields are in Post and this allows
            // a generic form.
            res.render('question/edit', {
                post: question,
                question: {
                    id: question.id
                },
                page: {
                    title: 'Edit question'
                }
            });
        }
    });
}

// Used by get, edit functions etc.
var getQuestion = function (req, callback) {
    // ETag support.
    var reqIfNoneMatch = req.get(enums.ifNoneMatch) || null;

    generic.get(req.models.Question, req.params.question_id, reqIfNoneMatch, function (err, question) {
        if (!err && question) {
            
            var relativeCreatedDate = utils.date.relativeTime(question.date, {abbreviated: true});
            var relativeTargetDateTimeOccurred = utils.date.relativeTime(question.targetDateTimeOccurred, {abbreviated: true});
            
            var questionTmp = {
                title: question.title,
                id: question.id,
                text: question.text,
                targetLocality: question.targetLocality,
                targetLat: question.targetLat,
                targetLong: question.targetLong,
                targetImage: question.targetImage,
                targetDateTimeOccurred: question.targetDateTimeOccurred,
                relativeTargetDateTimeOccurred: relativeTargetDateTimeOccurred,
                date: question.date,
                relativeCreatedDate: relativeCreatedDate,
                author: question.author,
                tags: question.tags,
                updated: question.updated
            }, wrapper = {
                question: questionTmp
            };
            
            question.getAnswers(function (err, answers) {
               if (!err && answers) {
                   // Answers present.
                   
                   console.log('answers');
                   console.log(answers);
                   
                   // Include answers within question
                   async.each(answers, function(answer, callback) {
                       generic.gen(answer, function(cb) {
                           callback();
                       });
                       
                   }, function (err) {
                       if (!err) {
                           console.log('answers');
                           console.log(answers);
                           questionTmp.answers = answers;
                           
                           //res.json(wrapper);
            
                           console.log(wrapper);
                           
                           callback(err, questionTmp);
                       }
                   });
               } 
            });
            

        } else if (err === enums.NOT_MODIFIED) {
            callback(err);
        } else {
            callback(err);
        }

    });  
};

// Get a specific question.
exports.get = function (req, res) {
    //get(req.models.Question, req.params.question_id, res, 200);

    getQuestion(req, function(err, question) {
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
            res.set(enums.eTag, question.updated);
            
            res.status(200);
            
            res.render('question/one', {
                question: question,
                page: {
                    title: question.title
                }
            });
        }
    });
};

exports.head = function (req, res) {

    // ETag support.
    var reqIfNoneMatch = req.get(enums.ifNoneMatch);

    generic.get(req.models.Question, req.params.question_id, reqIfNoneMatch, function (err, question) {
        if (!err && question) {
            res.set(enums.eTag, question.updated);
            res.end();
            req.destroy();
        } else if (err === enums.NOT_MODIFIED) {
            // 304 Not Modified.
            res.status(304);
            res.end();
        } else {
            generic.genericErrorHandler(req, res, err);
        }
    });
};

// Adds a question and responds with the created question.
exports.new = function (req, res) {
    // This is a POST request, so by default, fields go into the body.

    // only extra columns (apart from post) need to be written here
    var data = { 

    };
    generic.create(req.models.Question, data, req, function (err, question) {
        if (!err && question) {
            generic.get(req.models.Question, question.id, undefined, function (err, question2) {
                if (!err && question2) {
                    var wrapper = {
                        question: question2
                    };
                    res.status(201);
                    res.set(enums.eTag, question2.updated);
                    res.json(wrapper);
                    res.end();
                } else {
                    //special err: if 404 then it means the create just executed is invalid.
                    res.status(500);
                    res.end('Error 500: Server Error');
                    console.r.error(req, 500, err);
                }
            });
        } else {
            generic.genericErrorHandler(req, res, err);
        }
    });
};

// Update question
exports.update = function (req, res) {

    generic.get(req.models.Question, req.params.question_id, undefined, function (err, question) {
        if (!err && question) {
            generic.update(req.models.Question, req.params.question_id, req, function (err) {
                if (!err) {
                    //204 no content
                    res.status(204);
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

// Delete question
exports.remove = function (req, res) {
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