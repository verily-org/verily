//Controller for QuestionComment
var generic = require('./generic');
var enums = require('../enums');

var async = require('async');

exports.get = function (req, res) {

    // ETag support.
    var reqIfNoneMatch = req.get(enums.ifNoneMatch);

    generic.get(req.models.Question, req.params.question_id, undefined, function (err, question) {
        if (!err && question) {
            generic.get(req.models.QuestionComment, req.params.comment_id, reqIfNoneMatch, function (err, comment) {
                if (!err && comment) {
                    var questioncomment = {
                        id: comment.id,
                        text: comment.text,
                        date: comment.date,
                        author: comment.author,
                        updated: comment.updated
                    }, wrapper = {
                        question_comment: questioncomment
                    };
                    res.set(enums.eTag, questioncomment.updated);
                    res.status(200);
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
};

exports.head = function (req, res) {

    // ETag support.
    var reqIfNoneMatch = req.get(enums.ifNoneMatch);

    generic.get(req.models.Question, req.params.question_id, undefined, function (err, question) {
        if (!err && question) {
            generic.get(req.models.QuestionComment, req.params.comment_id, reqIfNoneMatch, function (err, comment) {
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
};

//get all comments for a question
exports.all = function (req, res) {
    generic.get(req.models.Question, req.params.question_id, undefined, function (err, question) {
        if (!err && question) {
            //question exists
            question.getComments(function (err, comments) {
                if (err || !comments || comments.length === 0) {
                    err = {};
                    err.code = 2;
                    generic.genericErrorHandler(req, res, err);
                } else {
                    async.each(comments, generic.gen, function (err) {
                        if (err) {
                            generic.genericErrorHandler(req, res, err);
                        } else {
                            var wrapper = {
                                question_comments: comments
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

// Add comment to question
exports.create = function (req, res) {
    generic.get(req.models.Question, req.params.question_id, undefined, function (err, question) {
        if (!err && question) {
            //questiion exists
            generic.create(req.models.QuestionComment, {}, req, function (err, comment) {
                if (!err && comment) {
                    comment.setQuestion(question, function (err) {
                        if (!err) {
                            generic.get(req.models.QuestionComment, comment.id, undefined, function (err, comment2) {
                                if (!err && comment2) {
                                    var questioncomment = {
                                        id: comment2.id,
                                        text: comment2.text,
                                        date: comment2.date,
                                        author: comment2.author,
                                        updated: comment2.updated
                                    }, wrapper = {
                                        question_comment: questioncomment
                                    };
                                    res.status(201);
                                    res.set(enums.eTag, questioncomment.updated);
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
        } else {
            generic.genericErrorHandler(req, res, err);
        }
    });
};



//Update question comment
exports.update = function (req, res) {
    generic.get(req.models.Question, req.params.question_id, undefined, function (err, question) {
        if (!err && question) {
            generic.get(req.models.QuestionComment, req.params.comment_id, undefined, function (err, questioncomment) {
                if (!err && questioncomment) {
                    generic.update(req.models.QuestionComment, req.params.comment_id, req, function (err) {
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

//Delete 1 question comment
exports.remove = function (req, res) {

    generic.get(req.models.Question, req.params.question_id, undefined, function (err, question) {
        if (!err && question) {
            generic.get(req.models.QuestionComment, req.params.comment_id, undefined, function (err, questionComment) {
                if (!err && questionComment) {
                    generic.removeOne(questionComment, req, function (err) {
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