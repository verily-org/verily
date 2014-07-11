var fs = require('fs');
var path = require('path');
var utils = require('utilities');

var gm = require('gm');
var imagick = gm.subClass({ imageMagick: true });

var enums = require('../enums');
var config = require('../config');
var common = require('../static/js/common');
var role = require('../lib/roles').user;
var mode = require('../mode');
var s3 = require('../s3');

var urlSafeBase64 = require('urlsafe-base64');

var smtpTransport = require('../lib/auth').mailer,
crypto = require('crypto'),
async = require('async');

exports.isAdmin = function() {
    return role.can('assign roles');
}

exports.generateUsernameDigits = function(callback) {
    var numBytes = 4;
    callback(crypto.randomBytes(numBytes).toString('hex'));
}

exports.generateRefCodes = function(count, callback) {
    async.times(count, function(n, next) {
        generateRefCode(function(err, refcode) {
            next(err, refcode);
        });
    }, function(err, refcodes) {
        callback(refcodes);
    });
}

var generateRefCode = exports.generateRefCode = function(callback) {
    var numRandomBytes = 6;
    crypto.randomBytes(numRandomBytes, function(err, buffer) {
        var random = urlSafeBase64.encode(buffer);
        var now = new Date().getTime().toString();
        now = now.substring(now.length - 2);
        var refcode = random + now;
        callback(err, refcode);
    });
};

exports.genericErrorHandler = function (req, res, err) {
    if (!err) {
        err = {};
    }
    if (err.code === 2) {
        // res.redirect('/400');
        // res.end();
        res.status(404);
        res.end('Error 404: Not found');
        console.r.error(req, 404, err);
    } else {
        // res.redirect('/500');
        // res.end();
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



// Creates an instance of model, creates a Post and links the model instance
// to the created post.
// Calls back with the created instance of model.
exports.create = function (model, data, req, cb) {
    
    common.validateDateTimeOccurred(req.body.targetDateTimeOccurred, null, null, function(error, targetDateTimeOccurred) {
        if (!error) {
            
            // Create the model item.
            model.create([data], function (err, items) {
                if (err) {
                    cb(err, null);
                }
                // items = array of inserted items 
                // After the item has been created.
                // We only add one item, so use items[0].
                var item = items[0];
           
                // Tags: tag1, tag2, tag3, ..., tagN
                var tags = null;
                if (req.body.hasOwnProperty('tags')) {
                    tags = common.tagize(req.body.tags);
                }
        
                // We want to store the created and updated date
                // in UTC -- Date.now() returns current time in milliseconds since 1970 in UTC.
                var now = new Date(Date.now());
                                
                if (req.body.formSelectImage === 'link' && req.body.targetImageUrl) {
                    imageHandled(req.body.targetImageUrl);
                } else if (req.body.formSelectImage === 'upload' && req.files && req.files.targetImageUpload && req.files.targetImageUpload.name !== '' && req.files.targetImageUpload.size !== 0) {
                    crypto.randomBytes(8, function(err, buffer) {
                        var random = buffer.toString('hex');
                        
                        var imageId = now.getTime() + random;
                    
                        // Base target image path.
                        var targetImagePath = 'images/submissions/' + imageId + path.extname(req.files.targetImageUpload.name);
                        
                        if (mode.isHeroku()) {
                            // Running on Heroku, so store in S3.
                        	// TODO: resize image
                            var fileReadStream = fs.createReadStream(req.files.targetImageUpload.path);
                            //var resizedStream = imagick(fileReadStream, req.files.targetImageUpload.name
                            //		).resize(500,500).stream();
                            s3Upload(s3, targetImagePath, fileReadStream, imageHandled);
                            //s3Upload(s3, targetImagePath, resizedStream, imageHandled);
                            
                        } else {
                            // Not running on Heroku, so store in filesystem.
                            targetImagePath = '/static/' + targetImagePath;
                            
                            fs.rename(req.files.targetImageUpload.path, config.project_dir + targetImagePath, function(err) {
                                if (err) {
                                    cb(err, null);
                                }
                                imageHandled(targetImagePath);
                        
                            });
                        }
                    });
                } else {
                    // No image specified.
                    imageHandled(undefined);
                }
                
                // After image handling completed.
                function imageHandled(targetImagePath) {
                    // Do the Post stuff.
                
                    var postData = {
                        title: req.body.title,
                        text: req.body.text,
                        targetImage: targetImagePath,
                        targetVideoUrl: req.body.targetVideoUrl,
                        targetLocality: req.body.targetLocality,
                        targetLat: req.body.targetLat,
                        targetLong: req.body.targetLong,
                        automaticLocation: req.body.automaticLocation,
                        date: now,
                        author: req.user.name,
                        tags: tags,
                        updated: now
                    }
        
                    postData.targetDateTimeOccurred = targetDateTimeOccurred;



                    req.models.Post.create([postData], function (err, items) {
                        if (err) {
                            cb(err, null);
                        }

                        var post = items[0];
                        post.setUser(req.user, function (err) {
                            post.save(function (err) {
                                if (err) {
                                    cb(err, null);
                                }
                            });
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
                }
                

            });
        }
        else{
            cb(error, null);

        }
    });

};

function s3Upload(s3, targetImagePath, fileReadStream, done){
    s3.put(targetImagePath, fileReadStream, s3.ACL_PUBLIC_READ, function(err, data) {
        if (err) {
            console.log('Error in AWS S3 upload:')
            console.log(err);
        } else {
            console.log('AWS S3 -- successful upload');
        }

        // URL that the file is available on S3.
        var destinationUrl = 'https://' + s3.BUCKET_ID + '.s3.amazonaws.com/' + targetImagePath;

        done(destinationUrl);

    });
}

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
                //Check if the item is not hidden
                    if(common.isUserContentShow(item.post.user) && common.isItemShow(item)){

                    if (!err && post) {
//                    Used for caching
                        // If reqIfNoneMatch is present, compare with it.
//                    if (reqIfNoneMatch && post.updated === cutQuotes(reqIfNoneMatch)) {
//                        // Client has latest version:
//                        // resource has NOT changed
//                        cb(enums.NOT_MODIFIED);
//                    } else {
                        // Client does not have latest version:
                        // resource has changed.
                        exports.load_post_ratings_count(item, function(err){
                            if(err){
                                cb(err, null);
                            }
                            else{
                                cb(null, item);
                            }
                        });
//                    }
                    } else {
                        cb({}, null);
                    }
                }
                else{
                    var err = {code:2};
                    cb(err, null);
                }
            });
        } else {
            cb(err, null);
        }
    });
};

exports.update = function (model, id, req, cb) {
    
    common.validateDateTimeOccurred(req.body.targetDateTimeOccurred, null, null, function(error, targetDateTimeOccurred) {
        if (!error) {
            
            // Set req.body.targetDateTimeOccurred to constructed Date object.
            if (targetDateTimeOccurred) {
                req.body.targetDateTimeOccurred = targetDateTimeOccurred;
            } else {
                delete req.body.targetDateTimeOccurred;
            }
            
            
            model.get(id, function (err, item) {

                if (req.body.formSelectImage === 'link' && req.body.targetImageUrl) {
                    imageHandled(req.body.targetImageUrl);
                } else if (req.body.formSelectImage === 'upload' && req.files && req.files.targetImageUpload && req.files.targetImageUpload.name !== '' && req.files.targetImageUpload.size !== 0) {
                    crypto.randomBytes(8, function(err, buffer) {
                        var random = buffer.toString('hex');

                        var now = new Date();
                        var imageId = now.getTime() + random;

                        // Base target image path.
                        var targetImagePath = 'images/submissions/' + imageId + path.extname(req.files.targetImageUpload.name);

                        if (mode.isHeroku()) {
                            console.log('before s3 upload');
                            // Running on Heroku, so store in S3.
                        	// TODO: resize image
                            var fileReadStream = fs.createReadStream(req.files.targetImageUpload.path);
							///////
                            //var resizedStream = imagick(fileReadStream, req.files.targetImageUpload.name
                            //		).resize(500,500).stream();
                            s3Upload(s3, targetImagePath, fileReadStream, imageHandled);
                            //s3Upload(s3, targetImagePath, resizedStream, imageHandled);

                        } else {
                            // Not running on Heroku, so store in filesystem.
                            targetImagePath = '/static/' + targetImagePath;

                            fs.rename(req.files.targetImageUpload.path, config.project_dir + targetImagePath, function(err) {
                                if (err) {
                                    cb(err, null);
                                }
                                imageHandled(targetImagePath);

                            });
                        }
                    });
                } else {
                    // No image specified.
                    imageHandled(undefined);
                }
                function imageHandled(targetImagePath){
                    var itemNew = {},
                        postNew = {},
                        i = {};
                    //Set the image if not undefined
                    if(targetImagePath){
                        postNew.targetImage = targetImagePath;
                    }

                    // Tags: tag1, tag2, tag3, ..., tagN
                    if (req.body.hasOwnProperty('tags')) {
                        req.body.tags = common.tagize(req.body.tags);
                    }

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
                            var now = new Date();
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
                }

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

exports.relativeTime = function(target) {
    // If more than 30 days have passed, don't bother doing relative time.
    var returner = null;
    
    if (target) {
        var now = new Date(Date.now());
        var diff = utils.date.diff(target, now, utils.date.dateParts.DAY);
    
        if (diff <= 30) {
            returner = utils.date.relativeTime(target, {abbreviated: true});
        }            
    }
    
    return returner;
}


exports.load_crisis_extra_fields = function(crisis, callback){    
    crisis.relativeCreatedDate = exports.relativeTime(crisis.post.date);
        
    crisis.relativeTargetDateTimeOccurred = exports.relativeTime(crisis.post.targetDateTimeOccurred);
    
    crisis.getPost(function(err, post){
        if (!err && post) {
            crisis.importanceCount = crisis.post.getImportanceCount();
            callback();
        }
        else{
            callback(err);
        }
    });
}
exports.load_question_extra_fields = function(question, callback){
    if(question.answers == undefined){
        question.getAnswers({autoFetch:true,autoFetchLimit:3}, function(err, answers){
            if (!err && answers) {
                question.rejectedAnswerCount = question.getRejectedAnswerCount();
                question.supportedAnswerCount = question.getSupportedAnswerCount();
                if(question.post.ratings == undefined){
                    question.getPost(function(err, post){
                        if (!err && answers) {
                            question.importanceCount = question.post.getImportanceCount();
                            question.popularityCoefficient = getQuestionPopularityCoefficient(question);
                            callback();
                        }
                        else{
                            callback(err);
                        }
                    });
                }
                else{
                    question.importanceCount = question.post.getImportanceCount();
                    callback();
                }
            }
            else{
                callback(err);
            }
        });
    }
    else{
        question.rejectedAnswerCount = question.getRejectedAnswerCount();
        question.supportedAnswerCount = question.getSupportedAnswerCount();
        question.importanceCount = question.post.getImportanceCount();
        question.popularityCoefficient = getQuestionPopularityCoefficient(question);
        callback();
    }
}
var load_post_ratings_count_function = function(item, callback){

    //item.post.getUser(function(a,d){});
    item.post.getRatings(function(err, ratings){
        if (!err && ratings) {
            item.post.upvoteCount = item.post.getUpvoteCount();
            item.post.downvoteCount = item.post.getDownvoteCount();
            item.post.importanceCount = item.post.getImportanceCount();
            callback();
        }
        else{
            callback(err);
        }
    });
}
exports.load_post_ratings_count = load_post_ratings_count_function;
exports.load_answers_extra_fields = function(answer, callback){
    //item.post.getUser(function(a,d){});
    load_post_ratings_count_function(answer, function(err){
        if(!err){
            answer.popularityCoefficient = getAnswerPopularityCoefficient(answer);
            callback();
        }
        else{
            callback(err);
        }
    });
}

function getQuestionPopularityCoefficient(question){
    var popularityCoefficient = question.importanceCount + question.rejectedAnswerCount + question.supportedAnswerCount;
    return popularityCoefficient;
}

function getAnswerPopularityCoefficient(answer){
    var popularityCoefficient = answer.post.upvoteCount + answer.post.downvoteCount + answer.post.importanceCount + answer.comments.length;
    return popularityCoefficient;
}

exports.generateToken = function (done) {
    crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
    });
};


exports.sendMailtoLocal = function (req, token, local, scenario, cb) {
    var text = '';
    var subject = '';
    switch (scenario) {
        case 'verify':
            subject = 'Verify User Account';
            text = 'You are receiving this because you (or someone else) have recently created an account on Verily!\n\n'+
                    'Please click on the following link, or paste this into your browser in order to verify '+
                    'your account!\n\n'+
                    'https://' + req.headers.host + '/verify/' + token + '\n\n';
            break;

        case 'forgot':
            subject = 'Verily Password Reset';
            text= 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                'https://' + req.headers.host + '/reset/' + token + '\n\n' +
                'If you did not request this, please ignore this email and your password will remain unchanged.\n';
            break;

        case 'reset': 
            subject = 'Your Verily password has been changed';
            text = 'Hello,\n\n' +
                    'This is a confirmation that the password for your account ' + local.email + ' has just been changed.\n';
            break;

        default:

    }

    var mailOptions = {
        to: local.email,
        from: 'contact@veri.ly',
        subject: subject,
        text: text
    };
    
    if (mode.getRunningMode() === mode.PROD_MODE) {
        smtpTransport.sendMail(mailOptions, function(err) {
            if (err) {
                req.flash('error', 'The email could not be sent.');
            }
            cb(err, local);
        });
    } else {
        console.log('Not in production mode, cannot send email');
    }
    

};


exports.showHideItem = function (model, itemIds, show, callback) {
    if (itemIds) {
        model.find({id: itemIds, show: !show}, function (err, items) {
            if (err) {
                console.log(err);
                callback(err);
            } else {
                async.each(items, function (item, cb) {
                    item.show = show;
                    item.save(function (err) {
                        cb(err);
                    }); 
                }, function (err) {
                    callback(err);
                });
            }
        }); 
    } else {
        callback();
    }
};

