var bcrypt   = require('bcrypt-nodejs');

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
    }), Question = db.define('question', {
        viewCount: {
            type: 'number'
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
    }), User = db.define('user', {
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
    }), UserFacebook = db.define('userFacebook', {
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
    });

    Answer.hasOne('question', Question, {
        reverse: 'answers'
    });
    
    Post.hasOne('rating', Rating);
    
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

    if (cb) {
        cb();
    }
};