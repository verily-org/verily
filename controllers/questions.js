var generic = require('./generic');
var enums = require('../enums');
var swig = require('swig');
var async = require('async');
var utils = require('utilities');
var oembed = require('oembed');
var fs = require('fs');
var s3 = require('../s3');
var mode = require('../mode');
var path = require('path');
var exifHelper = require('../helpers/exif');

var query = require('../lib/sqlQueries');
var memwatch = require('memwatch');

var common = require('../static/js/common');

var userController = require('./users');
var role = require('../lib/roles').user;

var trueValue;
var falseValue;
if (mode.isHeroku() || process.env.DATABASE === 'postgres') {
    trueValue = true;
    falseValue = false;
} else {
    trueValue = 1;
    falseValue = 0;
}

// Enables discovery of questions – this is the questions spotlight.
exports.index = function (req, res) {
    res.redirect('/');
    res.end();
};

var getQuestionRelevance = function (words, relevantQuestions, question, cb) {
    var word;
    var relevance = 0;
    try {
        var tags = JSON.parse(question.tags);
        question.tags = tags;
    } catch (e)
    {
        
    }
    // measure the relevenace of a question to the search text
    // similarities with the tags and locality are more important than text ant title.
    for (var i = 0; i < words.length; i++) {
        word = words[i];
        if (question.title.toLowerCase().indexOf(word) !== -1) relevance++;
        if (question.text != null && question.text.toLowerCase().indexOf(word) !== -1) relevance++;
        if (question.tags != null && question.tags.indexOf(word) !== -1) relevance += 3;
        if (question.targetLocality != null && question.targetLocality.toLowerCase().indexOf(word) !== -1) relevance += 3;
    }
    if (relevance > 0) {
        question.relevance = relevance;
        relevantQuestions.push(question);
    }
    cb();
};

var renderSearchResults = function(req, res, questions) {
    res.render('question/search', {
        page: {
            title: 'Search Questions'
        },
        info: req.flash('info'),
        error: req.flash('error'),
        questions: questions
    });
};

var searchQuestionsByWords = function (req, res, words, relevantQuestions) {
    query.findAllQuestions(req, true, function (err, questions) {
        if (err) {
            console.log(err);
            generic.genericErrorHandler(req, res, err);
        } else {
            if (questions.length > 0) {
                async.each(questions, getQuestionRelevance.bind(null, words, relevantQuestions), function (err) {
                    if (relevantQuestions.length > 0) {
                        async.each(relevantQuestions, query.load_question_extra_fields.bind(null, req), function (err) {
                            if (err) {
                                generic.genericErrorHandler(req, res, err);  
                            } else {
                                renderSearchResults(req, res, relevantQuestions);
                            }
                        });
                    } else {
                        req.flash('info', 'No results for "' + words.join(' ') + '"');
                        renderSearchResults(req, res, null);
                    }    
                });

                    
            } else {
                req.flash('info', 'No results for "' + words.join(' ') + '"');
                renderSearchResults(req, res, null);
            }
        }
    });
};

//Search Questions
exports.searchQuestions = function (req, res) {
    var query = req.body.search;
    var words = query.toLowerCase().split(' ');
    var relevantQuestions = [];
    searchQuestionsByWords(req, res, words, relevantQuestions);
};

exports.searchTag = function (req, res) {
    if (req.params.tag) {
        var tag = [req.params.tag];
        var relevantQuestions = [];
        searchQuestionsByWords(req, res, tag, relevantQuestions);
    } else {
        res.redirect('/');
    }
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
res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200);
    if (req.user){var user = req.user; }
    generic.get(req, req.models.Crisis, req.params.crisis_id, undefined, function (err, crisis) {
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
    if (req.user){var user = req.user; }
    generic.get(req, req.models.Crisis, req.params.crisis_id, undefined, function (err, crisis) {
        if (err) throw err;
        res.status(200);
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
    generic.get(req, req.models.Crisis, req.params.crisis_id, undefined, function (err, crisis) {
        if (err) throw err;

        var fs = require('fs');
        var key = req.body.key;

        if (mode.isHeroku()) {
            s3.get(key, function(err, data){
                if (err) {
                    console.log('error in getting from S3:');
                    console.log(err);
                    console.log(data);
                    res.render('question/createMultiple', {
                        page: {
                            title: 'Add multiple questions'
                        },
                        crisis: crisis,
                        error: 'Unable to get file with key: "' + key + '"'
                    });
                    return;
                }
                // Get the string (UTF-8) encoding of the data.
                var buffer = data.Body;
                var string = buffer.toString('utf8');
                var json = JSON.parse(string);
                createBulkQuestions(res, req, json, crisis);
        });
        }
        else{
            //read file frpm static/backups/questions/
            fs.readFile(req.body.key, function(err, data){
                if (err) {
                    console.log('error in getting from S3:');
                    console.log(err);
                    console.log(data);
                    res.render('question/createMultiple', {
                        page: {
                            title: 'Add multiple questions'
                        },
                        crisis: crisis,
                        error: 'Unable to get file with key: "' + key + '"'
                    });
                    return;
                }
                var json = JSON.parse(data);
                createBulkQuestions(res, req, json, crisis);
            });
        }
    });
}

var checkRole = role.can('create multiple questions');
function createBulkQuestions(res, req, json, crisis){

    async.eachSeries(json.questions,
        function(question, callback){
            //Prepare data
            var date;
            if(question.targetDateTimeOccurred){
                date = new Date(question.targetDateTimeOccurred);
            }
            req.body.formSelectImage = "link";

            if (date) {
                req.body.targetDateTimeOccurred = [date.getDate(), (date.getMonth()+1), date.getFullYear(), date.getHours(), date.getMinutes()];
            }


            if(!question.title || question.title == ""){
                callback("Title needed on question: " + question.key);
                return;
            }
            if(!question.title)
                throw "ERROR: question without title";
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
                        generic.get(req, req.models.Question, question.id, undefined, function (err, question2) {
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
}
exports.newQuestions = [checkRole, new_questions];

// View to edit a question
var editQuestion = function (req, res) {
    generic.get(req, req.models.Crisis, req.params.crisis_id, undefined, function (err, crisis) {
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
    
    // Works for pretty question URLs
    var questionId = parseInt(req.params.question_id);

    generic.get(req, req.models.Question, questionId, reqIfNoneMatch, function (err, question) {
        if (!err && question) {
            
            if(addView){
                question.post.addViewCount();
            }
            question.getAnswers(function(err,answers){
               if (!err && answers) {

                   async.each(question.answers,
                        function(answer, callback2){
                            answer.getPost(function(err, post){
                                if(err) callback2(err);
                                answer.post = post;
                                query.getUserOfPost(req, post, function (err, user) {
                                    answer.post.user = user;
                                    answer.getComments(function(err, comments){
                                        if(err) callback2(err);
                                        if (comments.length !== 0) {
                                            async.each(comments, function (comment, callback3) {
                                                comment.getUser(function (err) {
                                                    callback3(err);
                                                });
                                            }, function (err) {
                                                callback2(err);
                                            });   
                                        } else {
                                            callback2();
                                        }   
                                    });
                                });       
                            });},
                        function(err){
                            if(err){callback(err)}
                            question.answers = answers.filter(function(answer){
                                answer.comments = answer.comments.filter(function(comment){
                                    return common.isUserContentShow(comment.user)
                                        && comment.show;
                               });
                               return answer.show && common.isUserContentShow(answer.post.user);
                           });

                            query.load_question_extra_fields(req, question, function(err){
                               if (!err) {
                                   // Answers present.
                                   async.each(question.answers, generic.load_answers_extra_fields.bind(null, req), function (err) {
                                       if (err) {
                                           callback(err);
                                       } else {
                                           //question.answers = question.answers;
                                           
                                           callback(err, question);
                                       }
                                   });
                               } else {
                                   callback(err);
                               }

                            });
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
            title: question.post.title
        },
        user: user,
        properUser: common.properUser(req),
        refcodes: refcodes,
        info: req.flash('info'),
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

var addVideo = function(req, res, crisis, question, refcodes) {
    if (question.post.targetVideoUrl) {
        oembed.fetch(question.post.targetVideoUrl,{}, function(err, result) {

            if (!err) {
                question.post.targetVideoHtml = result.html.replace('http:', 'https:');
            } else {
                question.post.VideoUrlNotEmbeddable = question.post.targetVideoUrl;
            }


            applyUserAndRespond(req, res, crisis, question, refcodes);
        });
    } else {
        applyUserAndRespond(req, res, crisis, question, refcodes);
    }
}; 

// Get a specific question.
var getOne = function (req, res) {
    memwatch.gc();

    generic.get(req, req.models.Crisis, req.params.crisis_id, undefined, function (err, crisis) {
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
                
                if (req.path !== question.canonicalPath && !process.env.TEST) {
                    // Redirect the user to the canonical path
                    res.redirect(question.canonicalPath);
                    res.end();
                } else {
                    // Already using the canonical path!
                    generic.generateRefCodes(4, function(refcodeArray) {
                        var refcodes = {
                            twitter: refcodeArray[0],
                            facebook: refcodeArray[1],
                            email: refcodeArray[2],
                            link: refcodeArray[3]
                        };
                        
                        if (question.post.targetImage) {
                            question.post.targetImageData = {};
                            
                            exifHelper.extract(question.post.targetImage, function(exifData) {
                                question.post.targetImageData = exifData;
                
                                addVideo(req, res, crisis, question, refcodes);
                            });
                        } else {
                            addVideo(req, res, crisis, question, refcodes);
                        }
                    

                    });
                }
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
    generic.get(req, req.models.Crisis, crisis_id, undefined, function (err, crisis) {
        if (err) throw err;
        generic.create(req.models.Question, data, req, function (err, question) {
            if (!err && question) {
                question.setCrisis(crisis, function (err) {
                    if (err) throw err;
                    generic.get(req, req.models.Question, question.id, undefined, function (err, question2) {
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
                var quest_tags = [];
                async.eachSeries(question.post.tags || [], function(tag, cb){
                        req.models.Tags.exists({tag_name: tag}, function(err, exists) {
                            if(exists) {
                                req.models.Tags.find({tag_name: tag}, function(err,tag){
                                    quest_tags.push(tag[0]);
                                    cb();
                                });
                            } else {
                                req.models.Tags.create({tag_name: tag}, function(err, tag) {
                                    quest_tags.push(tag[0]);
                                    cb();
                                });
                            }
                        });
                    }, function(err) {
                        question.post.setExternTags(quest_tags, function(err) {cb();});
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
    generic.get(req, req.models.Question, req.params.question_id, undefined, function (err, question) {
        if (!err && question) {
            generic.update(req.models.Question, req.params.question_id, req, function (err) {
                if (!err) {
                    //204 no content
                    // res.status(204);
                    var quest_tags = [];
                    async.eachSeries(question.post.tags || [], function(tag, cb){
                            req.models.Tags.exists({tag_name: tag}, function(err, exists) {
                                if(exists) {
                                    req.models.Tags.find({tag_name: tag}, function(err,tag){
                                        quest_tags.push(tag[0]);
                                        cb();
                                    });
                                } else {
                                    req.models.Tags.create({tag_name: tag}, function(err, tag) {
                                        quest_tags.push(tag[0]);
                                        cb();
                                    });
                                }
                            });
                        }, function(err) {
                            question.post.setExternTags(quest_tags, function(err) {cb();});
                    });
                    
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

    generic.get(req, req.models.Question, req.params.question_id, undefined, function (err, question) {
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
    generic.get(req, req.models.Question, req.params.question_id, undefined, function (err, question) {
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

var exportQuestionsView = function(req, res){
    if (req.user){var user = req.user; }
    generic.get(req, req.models.Crisis, req.params.crisis_id, undefined, function (err, crisis) {
        if (err) throw err;
        var export_files_prefix = s3.QUESTION_EXPORT_FILE_PREFIX + crisis.id;
        if (mode.isHeroku()) {
            s3.list(export_files_prefix, function(err, data){
                if (err) {console.log(err);}
                var files = [];
                for(var i in data.Contents){
                    files.push(data.Contents[i].Key);
                }
                renderExportView(res, req, crisis, files, user);
            });
        }
        else{
            fs.readdir('static/backups/questions/', function(err, files){
                if (err) console.log(err);
                renderExportView(res, req, crisis, files, user);
            });
        }
    });
}
exports.exportQuestionsView = [role.can('export questions'), exportQuestionsView];
function renderExportView(res, req, crisis, files, user){
    res.status(200);
    res.render('question/exports', {
        page: {
            title: 'Export questions'
        },
        crisis: crisis,
        question_exports: files,
        info: req.flash('info'),
        user: user
    });
}

var exportQuestions = function(req, res){
    if (req.user){var user = req.user; }
    generic.get(req, req.models.Crisis, req.params.crisis_id, undefined, function (err, crisis) {
        if (err) throw err;
        var file_name = getExportsFileName(s3.QUESTION_EXPORT_FILE_PREFIX, crisis.id);
        getQuestionsJson(crisis, function(err, questions_json){
            if(err)generic.genericErrorHandler(req, res, err);
            var string = JSON.stringify(questions_json);
            if (mode.isHeroku()) {
                var file_path = file_name;
                s3.put(file_path, string, null, function(err, data){
                    if (err) {
                        console.log('err in s3 put');
                        console.log(err);
                        req.flash('error', 'Couldn\'t make the export');
                        res.redirect('/crisis/'+crisis.id+"/questions/export");
                        res.end();
                    } else {
                        console.log('s3 successful put');
                        req.flash('info', 'Export done successfully');
                        res.redirect('/crisis/'+crisis.id+"/questions/export");
                        res.end();
                    }
                });
            }
            else{
                var file_path = 'static/'+file_name;
                fs.writeFile(file_path, string, function(err){
                    if (err) console.log(err);
                    req.flash('info', 'Export saved successfully.');
                    res.redirect('/crisis/'+crisis.id+"/questions/export");
                    res.end();
                });
            }
        });
    });
}
exports.exportQuestions = [role.can('export questions'), exportQuestions];
function getQuestionsJson(crisis, callback){
    crisis.getQuestions({}, function(err, questions){
        if (err) {
            callback(err);
        }
        else{
            var questions_json = {};
            questions_json.questions = [];
            for(var key in questions){
                questions_json.questions.push( {
                    "title": questions[key].post.title,
                    "text": questions[key].post.text,
                    "targetImage": questions[key].post.targetImage,
                    "targetVideoUrl": questions[key].post.targetVideoUrl,
                    "targetLocality": questions[key].post.targetLocality,
                    "targetLat": questions[key].post.targetLat,
                    "targetLong": questions[key].post.targetLong,
                    "tags": questions[key].post.tags.join(),
                    "targetDateTimeOccurred": questions[key].post.targetDateTimeOccurred,
                    "automaticLocation": questions[key].post.automaticLocation,
                    "user_id": questions[key].post.user_id
                });
            }
            callback(null, questions_json);
        }
    });
}
function getExportsFileName(prefix, crisis_id){
    var now = new Date();
    var export_file_name = prefix + crisis_id + "-" + now.toISOString().replace(/[:T]/g,"-") + ".json";
    return export_file_name;
}
function JsonObjToArray(jsonObj){
    var result = [];

    for(var i in jsonObj)
        result.push( jsonObj [i]);
    return result;
}
