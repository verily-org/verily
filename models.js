module.exports = function (db, cb) {

    var Post = db.define('post', {
        text: {
            type: 'text'
        },
        date: {
            type: 'date',
            time: true,
            defaultValue: 'CURRENT_TIMESTAMP'
        },
        author: {
            type: 'text'
        },
        updated: {
            type: 'text'
        }
    }), Question = db.define('question', {
        title: {
            type: 'text'
        }
    }), Answer = db.define('answer', {
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

    if (cb) {
        cb();
    }
};