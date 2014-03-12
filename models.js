var bcrypt   = require('bcrypt-nodejs'),
    orm = require('orm');

module.exports = function (db, cb) {

    //  TODO: Ensure on migrration to MongoDB that default value is set to current timestamp equivalent or that it isn't the cause of an error
    var Post = db.define('post', {
        title: {
            type: 'text'
        },
        text: {
            type: 'text'
        },
        targetLocality: {
            type: 'text'
        },
        targetLat: {
            type: 'number'
        },
        targetLong: {
            type: 'number'
        },
        targetImage: {
            type: 'text'
        },
        targetDateTimeOccurred: {
            type: 'date',
            time: true,
            defaultValue: 'CURRENT_TIMESTAMP'
        },
        date: {
            type: 'date',
            time: true,
            defaultValue: 'CURRENT_TIMESTAMP'
        },
        author: {
            type: 'text'
        },
        tags: {
            type: 'object'
        },
        updated: {
            type: 'date',
            time: true,
            defaultValue: 'CURRENT_TIMESTAMP'
        }
    },
        {
            methods: {
                getUpvoteCount: function(){
                    return this.ratings.filter(function(rating){return rating.isUpvote()}).length;
                },
                getDownvoteCount: function(){
                    return this.ratings.filter(function(rating){return rating.isDownvote()}).length;
                },
                getImportanceCount: function(){
                    return this.ratings.filter(function(rating){return rating.isImportance()}).length;
                },
                isDownvotedOrUpvotedBy: function(user){
                    var thisUser = this.user;
                    return this.ratings.filter(function(rating){return (thisUser == rating.user) && rating.isUpvote() || rating.isDownvote()}).length > 0;
                },
            }
        }), Question = db.define('question', {
        viewCount: {
            type: 'number'
        }
    },
        {
            methods: {
                addViewCount: function(){
                    this.viewCount++;
                    this.save();
                },
                getSupportedAnswerCount: function(){
                    //If the answers are loaded returns amount of them of type Support, else not loaded returns 0!
                    if(this.answers != undefined){
                        return this.answers.filter(function(a){return a.type == "support"}).length;
                    }
                    else{
                        return 0;
                    }
                },
                getRejectedAnswerCount: function(){
                    //If the answers are loaded returns amount of them of type Reject, else not loaded returns 0!
                    if(this.answers != undefined){
                        return this.answers.filter(function(a){return a.type == "reject"}).length;
                    }
                    else{
                        return 0;
                    }
                }
            }
        }), Answer = db.define('answer', {
        type: {
            type: 'enum',
            values: ['support', 'reject']
        }
    }), QuestionComment = db.define('question_comment', {
    }), AnswerComment = db.define('answer_comment', {
    }), Rating = db.define('rating', {
        type: {
            type: 'enum',
            values: ['importance', 'upvote', 'downvote']
        },
        date: {
            type: 'date',
            time: true,
            defaultValue: 'CURRENT_TIMESTAMP'
        },
        author: {
            type: 'text'
        },
    },
        {
            methods: {
                isUpvote: function(){
                    return this.type == 'upvote';
                },
                isDownvote: function(){
                    return this.type == 'downvote';
                },
                isImportance: function(){
                    return this.type == 'importance';
                },
            }
        }
    ), Local = db.define('local', {
        email: {
            type: 'text'
        },
        password: {
            type: 'text'
        }
    }, {
        methods: {
            validPassword: function (pass) {
                return bcrypt.compareSync(pass, this.password); 
            }, 
            generateHash: function (pass) {
                return bcrypt.hashSync(pass, bcrypt.genSaltSync(8), null);
            }
        }
    }), Facebook = db.define('facebook', {
        id: {
            type: 'number'
        },
        token: {
            type: 'text'
        },
        email: {
            type: 'text'
        },
        name: {
            type: 'text'
        }
    }), User = db.define('user', {
            name: {
                type: 'text',
            },
            role: {
                type: 'enum',
                values: ['editor', 'simple']
            } 
    },{validations: {
        name: [orm.enforce.unique("name already taken!"),orm.enforce.ranges.length(1, undefined, "missing")],
    }});

    Answer.hasOne('question', Question, {
        reverse: 'answers'
    });

    Rating.hasOne('post', Post, {reverse: 'ratings', autoFetch: true});

    Rating.hasOne('user', User, {reverse: 'ratings'});
    
    Question.hasOne('post', Post);


    Answer.hasOne('post', Post);


    QuestionComment.hasOne('question', Question, {
        reverse: 'comments'
    });
    QuestionComment.hasOne('post', Post);

    AnswerComment.hasOne('answer', Answer, {
        reverse: 'comments'
    });
    AnswerComment.hasOne('post', Post);

    Post.hasOne('user', User, {
        reverse: 'posts'
    });

    User.hasOne('local', Local, {
        reverse: 'users'
    });
    User.hasOne('facebook', Facebook, {
        reverse: 'user'
    });

    if (cb) {
        cb();
    }
};
