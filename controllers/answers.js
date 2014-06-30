// Controller for Answer.
var generic = require('./generic');
var enums = require('../enums');
var oembed = require('oembed');

var async = require('async');
var role = require('../lib/roles').user;

// Get a specific answer
exports.get = function (req, res) {

    // ETag support.
    var reqIfNoneMatch = req.get(enums.ifNoneMatch);

    generic.get(req.models.Crisis, req.params.crisis_id, undefined, function (err, crisis) {
        if (!err && crisis) {
            generic.get(req.models.Question, req.params.question_id, undefined, function (err, question) {
                if (!err && question) {
                    generic.get(req.models.Answer, req.params.answer_id, reqIfNoneMatch, function (err, answer) {
                        if (!err && answer) {
                            if (req.user){var user = req.user; }
                            answer.getComments(function(err){
                                if(answer.post.targetVideoUrl){

                                    oembed.fetch(answer.post.targetVideoUrl, {}, function(err, result){

                                        if(!err){
                                            answer.post.targetVideoHtml = result.html;
                                        }else{
                                            answer.post.VideoUrlNotEmbeddable = answer.post.targetVideoUrl;
                                        }

                                        oneAnswerResponse(res, crisis, question, answer, user);
                                    });
                                }
                                else{
                                    oneAnswerResponse(res, crisis, question, answer, user);
                                }
                            });
                        }else {
                            generic.genericErrorHandler(req, res, err);
                        }
                    });
                } else {
                    generic.genericErrorHandler(req, res, err);
                }
            });

        } else {
            generic.genericErrorHandler(req, res, err);
        }
    });
};
function oneAnswerResponse(res, crisis, question, answer, user){
    //Sort comments in reverse chronological order
    answer.comments.sort(function(a,b){return b.comment.date - a.comment.date });
    res.render('evidence/one', {
        crisis: crisis,
        question: question,
        answer: answer,
        page: {
            title: answer.post.title
        },
        user: user
    });
}

exports.head = function (req, res) {

    // ETag support.
    var reqIfNoneMatch = req.get(enums.ifNoneMatch);

    generic.get(req.models.Question, req.params.question_id, undefined, function (err, question) {
        if (!err && question) {
            generic.get(req.models.Answer, req.params.answer_id, reqIfNoneMatch, function (err, answer) {
                if (!err && answer) {
//                    Used for caching:
//                    res.set(enums.eTag, answer.updated);
                    res.end();
                    req.destroy();
                } else {
                    generic.headErrorHandler(req, res, err);
                }
            });
        } else if (err === enums.NOT_MODIFIED) {
            // 304 Not Modified.
            res.status(304);
            res.end();
        } else {
            generic.genericErrorHandler(req, res, err);
        }
    });
};

// Get all answers ever, regardless of question id.
exports.allEver = function (req, res) { // this function finds all answers in db,regardless of the question id.
    req.models.Answer.find({}, function (err, Answers) {
        if (err || !Answers || Answers.length === 0) {
            generic.genericErrorHandler(req, res, err);
        } else {
            async.each(Answers, generic.load_post_ratings_count, function (err) {
                if (err) {
                    generic.genericErrorHandler(req, res, err);
                } else {
                    var wrapper = {
                        answers: Answers
                    };
                    res.status(200);
                    res.json(wrapper);
                    res.end();
                }
            });
        }
    });
};

// Get all answers for a specific question.
exports.all = function (req, res) { // this function finds all answers of an specific question.
    generic.get(req.models.Question, req.params.question_id, undefined, function (err, question) {
        if (!err && question) {
            //question exists
            question.getAnswers(function (err, answers) {
                if (err || !answers || answers.length === 0) {
                    err = {};
                    err.code = 2;
                    generic.genericErrorHandler(req, res, err);
                } else {
                    async.each(answers, generic.load_post_ratings_count, function (err) {
                        if (err) {
                            generic.genericErrorHandler(req, res, err);
                        } else {
                            var wrapper = {
                                answers: answers
                            };
                            res.status(200);
                            res.json(wrapper);
                            res.end();
                        }
                    });
                }
            });
        } else {
            generic.genericErrorHandler(req, res, err);
        }
    });
};

// Create an answer and add it to a question.
var createAnswer = function (req, res) {
    var crisis_id = req.params.crisis_id;
    generic.get(req.models.Question, req.params.question_id, undefined, function (err, question) {
        if (!err && question) {
            //question exists
            generic.create(req.models.Answer, {
                type: req.body.type
            }, req, function (err, answer) {
                if (!err && answer) {
                    answer.setQuestion(question, function (err) {
                        // TODO: Change this so that it redirects to1 created answer.
                        generic.get(req.models.Answer, answer.id, undefined, function (err, answer2) {
                            if (!err && answer2) {
                                var answerTmp = {
                                    id: answer2.id,
                                    text: answer2.text,
                                    date: answer2.date,
                                    author: answer2.author,
                                    updated: answer2.updated
                                }, wrapper = {
                                    answer: answerTmp
                                };
                                res.redirect('/crisis/'+ crisis_id +'/question/' + answer2.question_id);
                                //res.json(wrapper);
                                res.end();
                            } else {
                                generic.genericErrorHandler(req, res, err);
                            }
                        });
                    });

                } else {
                    //special err: if 404 then it means the create just excuted is invalid.
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

var checkRole = role.can('create an answer');

exports.create = [checkRole, createAnswer];



// Update answer
exports.update = function (req, res) {
    generic.get(req.models.Question, req.params.question_id, undefined, function (err, question) {
        if (!err && question) {
            generic.get(req.models.Answer, req.params.answer_id, undefined, function (err, answer) {
                if (!err && answer) {
                    generic.update(req.models.Answer, req.params.answer_id, req, function (err) {
                        if (!err) {
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
        }
    });
};

// Remove an answer
exports.remove = function (req, res) {
    generic.get(req.models.Question, req.params.question_id, undefined, function (err, question) {
        if (!err && question) {
            generic.get(req.models.Answer, req.params.answer_id, undefined, function (err, answer) {
                if (!err && answer) {
                    answer.getComments(function (err, acomments) {
                        var j,
                            afterRemove = function (err) {
                                if (err) {
                                    generic.genericErrorHandler(req, res, err);
                                    throw err;
                                }
                            };
                        for (j in acomments) {
                            if (acomments.hasOwnProperty(j)) {
                                //start to delete acomments
                                generic.removeOne(acomments[j], req, afterRemove);
                            }
                        }
                        //start to delete answers
                        generic.removeOne(answer, req, function (err) {
                            if (!err) {
                                res.status(200);
                                res.json(answer);
                            } else {
                                generic.genericErrorHandler(req, res, err);
                                throw err;
                            }
                        });
                        // answers are deleted.
                    });
                } else {
                    generic.genericErrorHandler(req, res, err);
                }
            });
        } else {
            generic.genericErrorHandler(req, res, err);
        }
    });
};
exports.upvote = function (req, res) {
    generic.get(req.models.Question, req.params.question_id, undefined, function (err, question) {
        if (!err && question) {
            generic.get(req.models.Answer, req.params.answer_id, undefined, function (err, answer) {
                if (!err && answer) {
                    require('./ratings').upvote(req, answer.post, function(err, rating){
                        generic.load_answers_extra_fields(answer, function(){
                            if(!err){
                                res.status(200);
                                res.json(answer);
                            } else {
                                generic.genericErrorHandler(req, res, err);
                            }
                        });
                    });
                } else {
                    generic.genericErrorHandler(req, res, err);
                }
            });
        } else {
            generic.genericErrorHandler(req, res, err);
        }
    });
};
exports.downvote = function (req, res) {
    generic.get(req.models.Question, req.params.question_id, undefined, function (err, question) {
        if (!err && question) {
            generic.get(req.models.Answer, req.params.answer_id, undefined, function (err, answer) {
                if (!err && answer) {
                    answer.getPost(function(err, post){
                        require('./ratings').downvote(req, post, function(err, rating){
                            generic.load_answers_extra_fields(answer, function(){
                                if(!err){
                                    res.status(200);
                                    res.json(answer);
                                } else {
                                    generic.genericErrorHandler(req, res, err);
                                }
                            });
                        });
                    });
                } else {
                    generic.genericErrorHandler(req, res, err);
                }
            });
        } else {
            generic.genericErrorHandler(req, res, err);
        }
    });
};
exports.getVideoHtml = function (req, res) {
    oembed.fetch(req.body.videoUrl, {}, function(err, result){

        if(!err){
            res.status(200);
            res.json(result);
        }else{
            res.status(200);
            res.json(err);
        }
    });
};