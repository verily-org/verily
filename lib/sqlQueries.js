var orm = require('orm');
var utils = require('utilities');
var common = require('../static/js/common');
var mode = require('../mode');
var async = require('async');

var postFields = "title, text, \"targetLocality\", \"targetLat\", \"targetLong\", \"automaticLocation\", "+
                "\"targetImage\", \"targetYoutubeVideoId\", \"targetVideoUrl\", \"targetDateTimeOccurred\", "+
                "date, author, tags, updated, \"viewCount\"";

var trueValue;
var falseValue;
if (mode.isHeroku() || process.env.DATABASE === 'postgres') {
    trueValue = true;
    falseValue = false;
} else {
    trueValue = 1;
    falseValue = 0;
}

exports.findQuestion = function (req, cb) {
    var crisis_id = req.params.crisis_id;
    var question_id = parseInt(req.params.question_id);
    var sql = "SELECT question.*, "+postFields+
            "FROM question, post "+
            "WHERE question.post_id = post.id AND question.show = "+trueValue+" AND question.id = "+question_id+
                " AND question.crisis_id = '"+crisis_id+"'";
    
    req.db.driver.execQuery(sql, function (err, result) {
        cb(err, result[0]);
    });
};

exports.findAllCrisisNames = function(req, cb) {
	var sql = "SELECT post.title, crisis.id FROM crisis left join post on crisis.post_id = post.id WHERE crisis.id > 1";
	req.db.driver.execQuery(sql, function(err, crysises) {
		cb(err, crysises);
	});
}
exports.findAllQuestionsOfACrisis = function (req, crisis_id, cb) {
	var sql = "SELECT question.*, "+postFields+
			"FROM question, post "+
			"WHERE question.post_id = post.id AND question.show = "+trueValue+" "+
				"AND question.crisis_id = '"+crisis_id+"'";
    
	req.db.driver.execQuery(sql, function (err, questions) {
        cb(err, questions);
    });
};

exports.findAllQuestions = function (req, shown, cb) {
    var sql = "SELECT question.*, "+postFields+
            "FROM question, post "+
            "WHERE question.post_id = post.id";

    if (shown) {
        sql += ' AND question.show = '+trueValue;
    }

    req.db.driver.execQuery(sql, function (err, questions) {
        cb(err, questions);
    });
};



exports.load_question_extra_fields = function (req, question, callback) {
    var sql = "SELECT count(case when answer.type = \'reject\' then 1 end) AS \"rejectedAnswerCount\", "+
            "count(case when answer.type = \'support\' then 1 end) AS \"supportedAnswerCount\" "+
            "FROM answer "+
            "WHERE answer.question_id = '"+question.id+"' AND answer.show = "+trueValue;

    req.db.driver.execQuery(sql, function (err, data) {
        if (!err && data) {
            question.rejectedAnswerCount = data[0].rejectedAnswerCount;
            question.supportedAnswerCount = data[0].supportedAnswerCount;
            question.popularityCoefficient = question.rejectedAnswerCount + question.supportedAnswerCount;

            question.date = new Date(question.date || question.post.date);
            var relativeCreatedDate = utils.date.relativeTime(question.date, {abbreviated: false});
            question.relativeCreatedDate = relativeCreatedDate;

            // Canonicalise the path to the pretty format
            // that works well for bookmarks.
            var postPrefix = 'question';
            if (req.path.indexOf('/question') !== -1) {
                postPrefix = null;
            } 
            if(req.path.indexOf('/news') !== -1) {
                req.path = "";
            }
            question.canonicalPath = common.prettyPath({
                req: req,
                postPrefix: postPrefix,
                id: question.id,
                string: question.title || question.post.title
            });
            callback();
        } else {
            callback(err);
        }
    });
};

exports.getAnswerRatings = function(req, post, callback){
    var user_id = req.user? req.user.id : 0;

    var sql = "SELECT count(case when rating.type = \'upvote\' then 1 end) AS \"upvotes\", "+
            "count(case when rating.type = \'downvote\' then 1 end) AS \"downvotes\", "+
            "count(case when rating.type = \'upvote\' "+
                "AND rating.user_id = "+user_id+" then 1 end) AS \"isupvotedby\", "+
            "count(case when rating.type = \'downvote\' "+
                "AND rating.user_id = "+user_id+" then 1 end) AS \"isdownvotedby\" "+
            "FROM rating "+
            "WHERE rating.post_id = '"+post.id+"' AND rating.show = "+trueValue;
            //"AND (SELECT )";

    req.db.driver.execQuery(sql, function (err, data) {
        if (err) {
            callback(err);
        } else {
            //console.log(data);
            post.upvoteCount = data[0].upvotes;
            post.downvoteCount = data[0].downvotes;
            post.isDownvotedByUser = data[0].isdownvotedby === 1 ? true : false;
            post.isUpvotedByUser = data[0].isupvotedby === 1 ? true : false;
            callback();
        }
    });
}

exports.getUserOfPost = function (req, post, cb) {
    var sql = "SELECT * FROM \"user\" WHERE id = '"+post.user_id+"'" ;

    req.db.driver.execQuery(sql, function (err, user) {
        if (!err && user) {
            cb(null, user[0]);
        } else {
            cb(err, null);
        }
    });
};

exports.getPostsCommentsOfUser = function (req, user, cb) {
    var sql = "SELECT count(*) as postcount FROM post "+
            "WHERE post.user_id = "+user.id;
    req.db.driver.execQuery(sql, function (err, data) {
        if (err) {
            cb(err);
        } else {
            user.postCount = data[0].postcount;
            var sql = "SELECT count(*) as commentcount FROM comment "+
                    "WHERE comment.user_id = "+user.id;
            req.db.driver.execQuery(sql, function (err, data) {
                if (err) {
                    cb(err);
                } else {
                    user.commentCount = data[0].commentcount;
                    user.postsCommentsCount = user.postCount + user.commentCount;  
                    cb(); 
                }
            }); 
        }
    });
};

exports.getUsers = function (req, cb) {
    var sql = 'SELECT "user"."id", "user".name, "user".active, '+
                'count(case when post.user_id = "user".id then 1 end) as postcount, '+
                'count(case when comment.user_id = "user".id then 1 end) AS commentcount '+
            'FROM "user", post, comment '+
            'WHERE "user".role = \'simple\' '+
            'ORDER BY "user"."id", "user".name, "user".active';

    req.db.driver.execQuery(sql, function (err, users) {
        if (!err && data) {
            //console.log(users);
            /*user.postCount = data[0].postcount;
            user.commentCount = data[0].commentcount;
            user.postsCommentsCount = user.postCount + user.commentCount;*/
            cb(null, users);
        } else {
            cb(err, null);
        }
    });
};

exports.getCommentsOfAnswer = function (req, answer_id, cb) {
    var sql = 'SELECT "user".*, comment.* FROM comment, "user" '+
            'WHERE comment.answer_id = '+answer_id+' AND comment.user_id = "user".id '+
            'AND comment.show = '+trueValue+' ORDER BY comment.date';

    req.db.driver.execQuery(sql, function (err, comments) {
        if (!err && comments) {
            cb(null, comments);
        } else {
            cb(err, null);
        }
    });
};

exports.getAnswersOfUser = function (req, user_id, cb) {
    var sql = 'SELECT answer.id, answer.show, answer.type, answer.post_id, answer.question_id, '+postFields+' '+
            'FROM post, answer '+
            'WHERE answer.post_id = post.id AND post.user_id = '+user_id;

    req.db.driver.execQuery(sql, function (err, answers) {
        if (!err && answers) {
            cb(null, answers);
        } else {
            cb(err, null);
        }
    });
};

exports.getCommentsOfUser = function (req, user_id, cb) {
    var sql = 'SELECT * FROM comment '+
            'WHERE comment.user_id = '+user_id;

    req.db.driver.execQuery(sql, function (err, comments) {
        if (!err && comments) {
            cb(null, comments);
        } else {
            cb(err, null);
        }
    });
};


exports.getRatingsOfUser = function (req, user, callback) {
    var sql = "SELECT count(case when rating.type = \'upvote\' then 1 end) AS \"upvotes\", "+
            "count(case when rating.type = \'downvote\' then 1 end) AS \"downvotes\" "+
            "FROM rating, post "+
            "WHERE rating.post_id = post.id AND post.user_id = "+user.id+" AND rating.show = "+trueValue;

    req.db.driver.execQuery(sql, function (err, data) {
        if (err) {
            callback(err);
        } else {
            user.upvotes = data[0].upvotes;
            user.downvotes = data[0].downvotes;
            callback();
        }
    });   
};

exports.getMatchedTags = function(req, query, cb) {
    req.db.driver.execQuery("SELECT id, tag_name FROM tag WHERE tag_name LIKE ?", 
        [ query ], function(err, items) {
            if(err) console.log(err);
            cb(err, items);
        });
}

exports.getNews = function(req, cb) {
    console.log("Getting news");
    var query = "SELECT p.*, q.* FROM post as p LEFT JOIN question as q ON p.id = q.post_id\n\
LEFT JOIN \n\
    (SELECT et.* FROM \"post_externTags\" as et LEFT JOIN user_tags as _ut ON et.externTags_id = _ut.tags_id \n\
        WHERE _ut.user_id = ?) as ut ON p.id = ut.post_id\n\
LEFT JOIN (SELECT * FROM \"user_subscribedCrises\" WHERE user_id = ?) as sc ON q.crisis_id = sc.subscribedcrises_id\n\
WHERE q.post_id IS NOT NULL AND (ut.post_id IS NOT NULL OR sc.subscribedcrises_id IS NOT NULL) ORDER BY p.updated DESC LIMIT 50";
    req.db.driver.execQuery(query, [req.user.id, req.user.id], function(err, items) {
        console.log("Getting news ok");
        cb(err, items);
    });
}

exports.getNewsCount = function(req, cb) {
    console.log("Getting news");
    var news = { newsTags: 0, newsCrises: 0 }
    var query = "SELECT COUNT(*) as newsTags FROM post as p LEFT JOIN question as q ON p.id = q.post_id\n\
LEFT JOIN (SELECT et.* FROM post_externTags as et LEFT JOIN user_tags as _ut ON et.externTags_id = _ut.tags_id \n\
        WHERE _ut.user_id = ?) as ut ON p.id = ut.post_id\n\
WHERE q.post_id IS NOT NULL AND ut.post_id IS NOT NULL AND p.updated > ?";
    req.db.driver.execQuery(query, [req.user.id, req.user.lastVisit], function(err, newsTags) {
        if(err) {
            console.log(err);
            cb(err, {'err': err});
            return;
        }
        console.log(newsTags);
        query = "SELECT COUNT(*) as newsCrises FROM post as p LEFT JOIN question as q ON p.id = q.post_id\n\
LEFT JOIN (SELECT * FROM user_subscribedCrises WHERE user_id = ?) as sc ON q.crisis_id = sc.subscribedcrises_id\n\
WHERE q.post_id IS NOT NULL AND sc.subscribedcrises_id IS NOT NULL AND p.updated > ?";
        req.db.driver.execQuery(query, [req.user.id, req.user.lastVisit], function(err, newsCrises) {
            if(err) {
                console.log(err);
                cb({'err': err});
                return;
            }
            cb(err, {newsTags: newsTags[0].newsTags, newsCrises: newsCrises[0].newsCrises})
        });
    });
}
