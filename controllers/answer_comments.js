// Controller for AnswerComment
var generic = require('./generic');
var enums = require('../enums');

var async = require('async');

// Get a specific comment of a specific answer.
exports.get = function (req, res) {

    // ETag support.
    var reqIfNoneMatch = req.get(enums.ifNoneMatch);

    generic.get(req.models.Question, req.params.question_id, undefined, function (err, question) {
        if (!err && question) {
            generic.get(req.models.Answer, req.params.answer_id, undefined, function (err, answer) {
                if (!err && answer) {
                    generic.get(req.models.AnswerComment, req.params.comment_id, reqIfNoneMatch, function (err, comment) {
                        if (!err && comment) {
                            var answerComment = {
                                id: comment.id,
                                text: comment.text,
                                date: comment.date,
                                author: comment.author,
                                updated: comment.updated
                            }, wrapper = {
                                answer_comment: answerComment
                            };
                            res.set(enums.eTag, comment.updated);
                            res.json(wrapper);
                            res.end();
                        } else if (err === enums.NOT_MODIFIED) {
                            // 304 Not Modified.
                            res.status(304);
                            res.end();
                        } else {
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

exports.head = function (req, res) {

    // ETag support.
    var reqIfNoneMatch = req.get(enums.ifNoneMatch);

    generic.get(req.models.Question, req.params.question_id, undefined, function (err, question) {
        if (!err && question) {
            generic.get(req.models.Answer, req.params.answer_id, undefined, function (err, answer) {
                if (!err && answer) {
                    generic.get(req.models.AnswerComment, req.params.comment_id, reqIfNoneMatch, function (err, comment) {
                        if (!err && comment) {
                            res.set(enums.eTag, comment.updated);
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
                } else {
                    generic.headErrorHandler(req, res, err);
                }
            });
        } else {
            generic.headErrorHandler(req, res, err);
        }
    });
};

// Get all comments for a specific answer.
exports.all = function (req, res) {
    req.models.Question.get(req.params.question_id, function (err, question) {
        if (err || !question) {
            // Error with getting the specified question.
            generic.genericErrorHandler(req, res, err);
        } else {
            req.models.Answer.get(req.params.answer_id, function (err, answer) {
                if (err || !answer) {
                    // Error with getting the specified answer.
                    generic.genericErrorHandler(req, res, err);
                } else {
                    // Getting the question and its answer was okay.
                    // Now get the comments of this answer.
                    answer.getComments(function (err, answerComments) {
                        if (err) {
                            generic.genericErrorHandler(req, res, err);
                        } else if (!answerComments || answerComments.length === 0) {
                            err = {};
                            err.code = 2;
                            generic.genericErrorHandler(req, res, err);
                        } else {
                            // Add post data to answer comments.
                            async.each(answerComments, generic.gen, function (err) {
                                if (err) {
                                    generic.genericErrorHandler(req, res, err);
                                } else {
                                    // Wrap up the question comments in an 'answer_comments' property.
                                    var wrapper = {
                                        answer_comments: answerComments
                                    };
                                    res.status(200);
                                    res.json(wrapper);
                                    res.end();
                                }
                            });

                        }
                    });

                }
            });
        }
    });

};

// Create comment and add it to answer.
exports.create = function (req, res) {
    generic.get(req.models.Question, req.params.question_id, undefined, function (err, question) {
        if (!err && question) {
            //questiion exists
            generic.get(req.models.Answer, req.params.answer_id, undefined, function (err, answer) {
                if (!err && answer) {
                    //answer exists
                    generic.create(req.models.AnswerComment, {}, req, function (err, comment) {
                        if (!err && comment) {
                            comment.setAnswer(answer, function (err) {
                                if (!err) {
                                    generic.get(req.models.AnswerComment, comment.id, undefined, function (err, comment2) {
                                        if (!err && comment2) {
                                            var answercomment = {
                                                id: comment2.id,
                                                text: comment2.text,
                                                date: comment2.date,
                                                author: comment2.author,
                                                updated: comment2.updated
                                            }, wrapper = {
                                                answer_comment: answercomment
                                            };
                                            res.status(201);
                                            res.set(enums.eTag, comment2.updated);
                                            res.json(wrapper);
                                            res.end();
                                        } else {
                                            generic.genericErrorHandler(req, res, err);
                                        }
                                    });
                                } else {
                                    generic.genericErrorHandler(req, res, err);
                                }
                            });

                        } else {
                            //special err: if 404 then it means the create just excuted is invalid.
                            res.status(500);
                            res.end('Error 500: Server Error');
                            console.r.error(req, 500, err);
                        }
                    });
                }
            });
        } else {
            generic.genericErrorHandler(req, res, err);
        }
    });
};

// Update an answer comment.
exports.update = function (req, res) {
    generic.get(req.models.Question, req.params.question_id, undefined, function (err, question) {
        if (!err && question) {
            generic.get(req.models.Answer, req.params.answer_id, undefined, function (err, answer) {
                if (!err && answer) {
                    generic.get(req.models.AnswerComment, req.params.comment_id, undefined, function (err, answercomment) {
                        if (!err && answercomment) {
                            generic.update(req.models.AnswerComment, req.params.comment_id, req, function (err) {
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
        } else {
            generic.genericErrorHandler(req, res, err);
        }
    });

};

// Remove an answer comment.
exports.remove = function (req, res) {
    generic.get(req.models.Question, req.params.question_id, undefined, function (err, question) {
        if (!err && question) {
            generic.get(req.models.Answer, req.params.answer_id, undefined, function (err, answer) {
                if (!err && answer) {
                    generic.get(req.models.AnswerComment, req.params.comment_id, undefined, function (err, answercomment) {
                        if (!err && answercomment) {
                            generic.removeOne(answercomment, req, function (err) {
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
        } else {
            generic.genericErrorHandler(req, res, err);
        }
    });

};