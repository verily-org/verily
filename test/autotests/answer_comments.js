var enums = require('../../enums.json'),
    generic = require('../generic'),
    url = require('url'),
    request = require('supertest'),
    rootUrl = url.format(enums.options),
    //Data for creation of answercomment
    createData = {
        text: 'answer comment text',
        author: 'my author name'
    },
    updateData = {
        text: 'New answer_comment text',
        author: 'New author name'
    };
request = request(rootUrl);

// Set the ETag we get back for question 1, so we can use it for testing
// in cacheCheck for the same question.
var question1ETag;

exports.createInvalid = function (test, doNotRun) {
    var returner = {},
        // Not sure about the path
        path = '/question/10/answer/10/comments',
        data = createData;

    returner.path = path;
    returner.data = data;

    if (!doNotRun) {
        request
            .post(path)
            .send(data)
            .expect(404)
            .end(function (err, res) {
                if (err) {
                    console.log(err.message);
                }
                test.ok(!err);
                test.done();
            });
    }

    return returner;

};

exports.create = function (test, doNotRun) {
    var returner = {},
        // Not sure about the path
        path = '/question/1/answer/1/comments',
        data = createData;

    returner.path = path;
    returner.data = data;

    if (!doNotRun) {
        request
            .post(path)
            .send(data)
            .expect(201)
            .end(function (err, res) {
                if (err) {
                    console.log(err.message);
                }
                var valid = generic.valid(err, data, res.body.answer_comment);
                test.ok(valid);
                test.done();
            });
    }

    return returner;

};

exports.get = function (test, doNotRun) {
    var returner = {},
        path = '/question/1/answer/1/comment/1';

    returner.path = path;
    // If doNotRun flag not defined or false,
    // then make the request.
    if (!doNotRun) {
        request
            .get(path)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    console.log(err.message);
                }
                question1ETag = res.get(enums.eTag);
                var valid = generic.valid(err, createData, res.body.answer_comment);
                test.ok(valid);
                test.done();
            });
    }

    return returner;
};
// If-None-Match check with ETag for resource on server.
exports.cacheCheck = function (test, doNotRun) {
    var returner = {}, path = '/question/1/answer/1/comment/1';

    returner.path = path;

    // If doNotRun flag not defined or false,
    // then make the request.
    if (!doNotRun) {
        request
            .get(path)
            .set('If-None-Match', question1ETag)
            .expect(304)
            .end(function (err, res) {
                if (err) {
                    console.log(err.message);
                }
                test.ok(!err);
                test.done();
            });
    }

    return returner;
};

exports.update = function (test, doNotRun) {
    var returner = {},
        //Not sure about the Path
        path = '/question/1/answer/1/comment/1',
        data = updateData;
    returner.path = path;
    returner.data = data;

    if (!doNotRun) {
        request
            .put(path)
            .send(data)
            .expect(204)
            .end(function (err, res) {
                if (err) {
                    console.log(err.message);
                }
                test.ok(!err);
                test.done();
            });
    }
    return returner;
};

exports.get_after_update = function (test, doNotRun) {
    var returner = {},
        //Not sure about the path.
        path = '/question/1/answer/1/comment/1',
        data = updateData,
        valid;
    returner.path = path;

    if (!doNotRun) {
        request
            .get(path)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    console.log(err.message);
                }
                valid = generic.valid(err, data, res.body.answer_comment);
                test.ok(valid);
                test.done();
            });
    }

    return returner;
};

// Head after update
exports.head = function (test, doNotRun) {
    var returner = {},
        path = '/question/1/answer/1/comment/1';
    returner.path = path;

    if (!doNotRun) {
        request
            .get(path)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    console.log(err.message);
                }
                test.ok(!err);
                test.done();
            });
    }

    return returner;
};
exports.create2 = function (test, doNotRun) {
    var returner = {},
        // Not sure about the path
        path = '/question/1/answer/1/comments',
        data = createData,
        valid;

    returner.path = path;
    returner.data = data;

    if (!doNotRun) {
        request
            .post(path)
            .send(data)
            .expect(201)
            .end(function (err, res) {
                if (err) {
                    console.log(err.message);
                }
                valid = generic.valid(err, data, res.body.answer_comment);
                test.ok(valid);
                test.done();
            });
    }

    return returner;

};

exports.remove = function (test, doNotRun) {
    var returner = {},
        path = '/question/1/answer/1/comment/2';
    returner.path = path;

    if (!doNotRun) {
        request
            .del(path)
            .expect(204)
            .end(function (err, res) {
                if (err) {
                    console.log(err.message);
                }
                test.ok(!err);
                test.done();
            });
    }

    return returner;

};

exports.get_after_remove = function (test, doNotRun) {
    var returner = {},
        path = '/question/1/answer/1/comment/2',
        data = createData;

    returner.path = path;

    // If doNotRun flag not defined or false,
    // then make the request.
    if (!doNotRun) {
        request
            .post(path)
            .send(data)
            .expect(404)
            .end(function (err, res) {
                if (err) {
                    console.log(err.message);
                }
                test.ok(!err);
                test.done();
            });
    }

    return returner;
};

exports.create_lastly = function (test, doNotRun) {
    var returner = {},
        // Not sure about the path
        path = '/question/1/answer/1/comments',
        data = createData,
        valid;

    returner.path = path;
    returner.data = data;

    if (!doNotRun) {
        request
            .post(path)
            .send(data)
            .expect(201)
            .end(function (err, res) {
                if (err) {
                    console.log(err.message);
                }
                valid = generic.valid(err, data, res.body.answer_comment);
                test.ok(valid);
                test.done();
            });
    }

    return returner;

};
//Get all comments
exports.all = function (test, doNotRun) {
    var returner = {},
        path = '/question/1/answer/1/comments',
        data = [updateData, createData],
        valid;

    returner.path = path;
    // If doNotRun flag not defined or false,
    // then make the request.
    if (!doNotRun) {
        request
            .get(path)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    console.log(err.message);
                }
                valid = generic.validArray(err, data, res.body.answer_comments);
                test.ok(valid);
                test.done();
            });
    }

    return returner;
};