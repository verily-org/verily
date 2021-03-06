var enums = require('../../enums.json'),
    generic = require('../generic'),
    url = require('url'),
    request = require('supertest');

var rootUrl = url.format(enums.options);
request = request(rootUrl);

// Test functions are used in providing examples for the documentation,
// so they return what they call. To match up with documentation, it is
// important to follow convention: the exported function name should 
// match the controller function name.
// As we are testing endpoints and responses, test functions depend on nothing 
// except enums.options for hostname and port.

// If doNotRun is enabled, only the path and data will be returned;
// the test will not be executed.

// Data for creation of answer.
var createData = {
    text: 'my answer text',
    author: 'the answer author'
};

var updateData = {
    text: 'NEW answer text',
    author: 'NEW author name'
};
// Set the ETag we get back for question 1, so we can use it for testing
// in cacheCheck for the same question.
var question1ETag;

exports.createInvalid = function (test, doNotRun) {
    var returner = {}, path = '/question/2/answers',
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
    var returner = {}, path = '/question/1/answers',
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
                var valid = generic.valid(err, data, res.body.answer);
                test.ok(valid);
                test.done();
            });
    }

    return returner;
};

exports.get = function (test, doNotRun) {
    var returner = {}, path = '/question/1/answer/1';

    returner.path = path;

    if (!doNotRun) {
        request
            .get(path)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    console.log(err.message);
                }
                question1ETag = res.get(enums.eTag);
                var valid = generic.valid(err, createData, res.body.answer);
                test.ok(valid);
                test.done();
            });
    }
    return returner;
};
// If-None-Match check with ETag for resource on server.
exports.cacheCheck = function (test, doNotRun) {
    var returner = {}, path = '/question/1/answer/1';

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
    var returner = {}, path = '/question/1/answer/1',
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
    var returner = {}, path = '/question/1/answer/1',
        data = updateData;
    returner.path = path;

    if (!doNotRun) {
        request
            .get(path)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    console.log(err.message);
                }
                var valid = generic.valid(err, data, res.body.answer);
                test.ok(valid);
                test.done();
            });
    }

    return returner;
};

// Head after update
exports.head = function (test, doNotRun) {
    var returner = {}, path = '/question/1/answer/1';
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
    var returner = {}, path = '/question/1/answers',
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
                var valid = generic.valid(err, data, res.body.answer);
                test.ok(valid);
                test.done();
            });
    }

    return returner;
};

exports.remove = function (test, doNotRun) {
    var returner = {}, path = '/question/1/answer/2';
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
    var returner = {}, path = '/question/1/answer/2',
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
    var returner = {}, path = '/question/1/answers',
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
                var valid = generic.valid(err, data, res.body.answer);
                test.ok(valid);
                test.done();
            });
    }

    return returner;
};

// All answers for a question.
exports.all = function (test, doNotRun) {
    var returner = {}, path = '/question/1/answers',
        expected = [updateData, createData];

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

                var valid = generic.validArray(err, expected, res.body.answers);
                test.ok(valid);
                test.done();
            });
    }

    return returner;
};

// All answers ever.
exports.allEver = function (test, doNotRun) {
    var returner = {}, path = '/answers',
        expected = [updateData, createData];

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

                var valid = generic.validArray(err, expected, res.body.answers);
                test.ok(valid);
                test.done();
            });
    }

    return returner;
};