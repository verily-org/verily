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

// Data for creation of question.
var createData = {
    text: 'my question text',
    title: 'the title of my question',
    author: 'me'
},
    updateData = {
        text: 'my NEW question text',
        title: 'the NEW title of my question',
        author: 'NEW me'
    };
// Set the ETag we get back for question 1, so we can use it for testing
// in cacheCheck for the same question.
var question1ETag;

exports.create = function (test, doNotRun) {
    var returner = {}, path = '/questions',
        data = createData;

    returner.path = path;
    returner.data = data;

    // If doNotRun flag not defined or false,
    // then make the request.
    // This is here because documentation does not want to make HTTP calls!
    if (!doNotRun) {
        request
            .post(path)
            .send(data)
            .expect(201)
            .end(function (err, res) {
                if (err) {
                    console.log(err.message);
                }
                var valid = generic.valid(err, data, res.body.question);
                test.ok(valid);
                test.done();
            });
    }

    return returner;
};

exports.get = function (test, doNotRun) {
    var returner = {}, path = '/question/1';

    returner.path = path;

    // If doNotRun flag not defined or false,
    // then make the request.
    // This is here because documentation does not want to make HTTP calls!

    if (!doNotRun) {
        request
            .get(path)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    console.log(err.message);
                }
                question1ETag = res.get(enums.eTag);
                var valid = generic.valid(err, createData, res.body.question);
                test.ok(valid);
                test.done();
            });
    }

    return returner;
};

// If-None-Match check with ETag for resource on server.
exports.cacheCheck = function (test, doNotRun) {
    var returner = {}, path = '/question/1';

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
    var returner = {}, path = '/question/1',
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
    var returner = {}, path = '/question/1',
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
                var valid = generic.valid(err, data, res.body.question);
                test.ok(valid);
                test.done();
            });
    }

    return returner;
};

// Head after update.
exports.head = function (test, doNotRun) {
    var returner = {}, path = '/question/1';
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
// Create the question again with createData.
exports.create_2 = function (test, doNotRun) {
    var returner = {}, path = '/questions',
        data = createData;

    returner.path = path;
    returner.data = data;

    // If doNotRun flag not defined or false,
    // then make the request.
    if (!doNotRun) {
        request
            .post(path)
            .send(data)
            .expect(201)
            .end(function (err, res) {
                if (err) {
                    console.log(err.message);
                }
                var valid = generic.valid(err, data, res.body.question);
                test.ok(valid);
                test.done();
            });
    }

    return returner;
};
exports.remove = function (test, doNotRun) {
    var returner = {}, path = '/question/2';
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
    var returner = {}, path = '/question/2',
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

// Create the question again with createData.
exports.create_lastly = function (test, doNotRun) {
    var returner = {}, path = '/questions',
        data = createData;

    returner.path = path;
    returner.data = data;

    // If doNotRun flag not defined or false,
    // then make the request.
    if (!doNotRun) {
        request
            .post(path)
            .send(data)
            .expect(201)
            .end(function (err, res) {
                if (err) {
                    console.log(err.message);
                }
                var valid = generic.valid(err, data, res.body.question);
                test.ok(valid);
                test.done();
            });
    }

    return returner;
};

// Now test the `all` endpoint.
exports.all = function (test, doNotRun) {
    var returner, path, expected;
    returner = {};
    path = '/questions';

    // Expected data back is the array comprising createData and createData2.
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
                var valid = generic.validArray(err, expected, res.body.questions);
                test.ok(valid);
                test.done();
            });
    }

    return returner;
};