var enums = require('../enums');
var common = require('../static/js/common');

exports.genericErrorHandler = function (req, res, err) {
    if (!err) {
        err = {};
    }
    if (err.code === 2) {
        res.status(404);
        res.end('Error 404: Not found');
        console.r.error(req, 404, err);
    } else {
        res.status(500);
        res.end('Error 500: Internal Server Error');
        console.r.error(req, 500, err);
    }
};

exports.headErrorHandler = function (req, res, err) {
    if (!err) {
        err = {};
    }
    if (err.code === 2) {
        res.status(404);
        console.r.error(req, 404, err);
    } else {
        res.status(500);
        console.r.error(req, 500, err);
    }
    res.end();
    req.destroy();
};

// Joins Post data with model instance data.
exports.join = function (item, post) {
    var i;
    // Delete the auto-added post object in item.
    if (item.hasOwnProperty('post')) {
        delete item.post;
    }
    for (i in post) {
        if (post.hasOwnProperty(i) && i !== 'id') {
            // Don't put in id properties
            // as they are already covered by {model}_id
            // in the association at the other end.
            item[i] = post[i];
        }
    }

    return item;
};
var join = exports.join;

exports.gen = function (item, callback) {
    item.getPost(function (err, post) {
        join(item, post);
        callback();
    });
};


// Creates an instance of model, creates a Post and links the model instance
// to the created post.
// Calls back with the created instance of model.
exports.create = function (model, data, req, cb) {

    model.create([data], function (err, items) {
        if (err) {
            cb(err, null);
        }
        // items = array of inserted items 
        // After the item has been created.
        // We only add one item, so use items[0].
        var item = items[0],
            now = new Date().getTime();
           
        // Tags: tag1, tag2, tag3, ..., tagN
        var tags = null;
        if (req.body.hasOwnProperty('tags')) {
            tags = common.tagize(req.body.tags);
        }        

        req.models.Post.create([{
            title: req.body.title,
            text: req.body.text,
            targetImage: req.body.targetImage,
            date: new Date(),
            author: req.body.author,
            tags: tags,
            updated: now
        }], function (err, items) {
            if (err) {
                cb(err, null);
            }

            var post = items[0];
            post.save(function (err) {
                if (err) {
                    cb(err, null);
                }
            });

            // After the post has been created,
            // add the association to its subclass – item.
            // We only add one post, so use items[0].
            item.setPost(post, function (err) {
                if (err) {
                    cb(err, null);
                }

                item.save(function (err) {
                    if (err) {
                        cb(err, null);
                    }

                    // Call back with the created instance of model.
                    cb(null, item);
                });
            });
        });
    });
};

// Removes quotes from a string
function cutQuotes(str) {
    if (str.charAt(0) === '"' && str.charAt(str.length - 1) === '"') {
        str = str.substring(1, str.length - 1);
    }
    return str;
}


// reqIfNoneMatch can be undefined, if so: it will return the model instance.
exports.get = function (model, id, reqIfNoneMatch, cb) {
    model.get(id, function (err, item) {
        // Get the item and data from the post.
        if (!err) {
            // Add the post fields to the output.
            item.getPost(function (err, post) {
                if (!err && post) {
                    // If reqIfNoneMatch is present, compare with it.
                    if (reqIfNoneMatch && post.updated === cutQuotes(reqIfNoneMatch)) {
                        // Client has latest version:
                        // resource has NOT changed
                        cb(enums.NOT_MODIFIED);
                    } else {
                        // Client does not have latest version:
                        // resource has changed.
                        join(item, post);
                        cb(null, item);
                    }
                } else {
                    cb({}, null);
                }
            });
        } else {
            cb(err, null);
        }
    });
};

exports.update = function (model, id, req, cb) {
    model.get(id, function (err, item) {

        var itemNew = {},
            postNew = {},
            i = {};

        for (i in req.body) {
            if (req.body.hasOwnProperty(i)) {
                if (model.allProperties.hasOwnProperty(i)) {
                    // Post property has been included in request, update item.
                    itemNew[i] = req.body[i];
                }

                if (req.models.Post.allProperties.hasOwnProperty(i)) {
                    // Item property has been included in request, update Post.
                    postNew[i] = req.body[i];
                }
            }

        }
        if (itemNew) {
            // Update item.
            item.save(itemNew, function (err) {
                if (err) {
                    throw err;
                }
            });
        }
        if (postNew) {
            // Update post.
            req.models.Post.get(item.post_id, function (err, post) {
                var now = new Date().getTime();
                post.updated = now;
                post.save(postNew, function (err) {
                    if (err) {
                        throw err;
                    }
                    // Update successful.
                    cb(null);
                });
            });
        }
    });
};

// only remove one item and its post
exports.removeOne = function (item, req, cb) {
    req.models.Post.get(item.post_id, function (err, post) {
        if (!err && post) {
            post.remove(function (err) {
                if (!err) {
                    item.remove(function (err) {
                        if (!err) {
                            //successful.
                            cb(null);
                        } else {
                            cb(err);
                        }
                    });
                } else {
                    cb(err);
                }
            });
        } else {
            cb(err);
        }
    });
};