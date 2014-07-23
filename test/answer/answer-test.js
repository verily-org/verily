var should  = require('should'),
    request = require('supertest'),
    test_utils = require('../utils.js'),
    async = require('async');

var app,
    global_db,
    crisis_post,
    global_accounts,
    global_questions,
    global_anon_agent;

var questions_file = {
        key: 'static/backups/questions/crisis-1.json'
    };

var question_post_1 = {
    title : "Why am I here?",
    targetDateTimeOccurred: [10, 2, 2014, 10, 20]
};

var support_answer = {
    title: 'This is an answer that supports the question',
    type: 'support'
};

var reject_answer = {
    title: 'This is an answer that rejects the question',
    type: 'reject'
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

var question_id = getRandomInt(0, 79);


describe('Questions', function(){

    before(function(done){
        this.timeout(10000);
        //Ensure the connection is made before testings begin
        test_utils.run_app(function(application, db){
            console.log('App started');
            app = application;
            global_db = db;
            done();
        });
    });

    after(function(done){
        this.timeout(10000);
        //Clear all the database
        test_utils.end_test(global_db, done);
    });


    

    describe('(Agents)', function(){
        //agents to save session cookies in order to test users and authenticated requests
        before('Create users, a crisis and 79 questions', function(done){
            this.timeout(10000);
            test_utils.set_users_agents_account(request, app, global_db, function (accounts){
                global_accounts = accounts;
                var editor_agent = global_accounts.editor_agent;
                var user = global_accounts.editor_user;
                //create a crisis
                test_utils.create_crisis(user, editor_agent, global_db, function (crisis) {
                    crisis_post = crisis;
                    var admin_agent = global_accounts.admin_agent;
                    test_utils.create_questions(admin_agent, global_db, function (questions) {
                        global_questions = questions;
                        test_utils.set_anon_agent(request, app, global_db, function (anon_agent) {
                            global_anon_agent = anon_agent;
                            done();
                        });
                    });
                });
            });
        });

        after('clear the database', function(done){
            this.timeout(10000);
            //Clear all the database
            test_utils.drop_db(global_db, done);
        });

        describe('Post to crisis/1/question/'+question_id+'/answers', function(){
            this.timeout(10000);
            it('Should create a support answer to question '+question_id, function(done){
                global_accounts.basic_agent.post('/crisis/1/question/'+question_id+'/answers')
                .send(support_answer)
                .expect('Content-Type', /text/)
                .expect(302)
                .expect('Location', '/crisis/1/question/'+question_id)
                .end(function(err, res){
                    if(err) throw err;
                    request(app).get('/crisis/1/question/'+question_id)
                    .expect('Content-Type', /text/)
                    .expect(200)
                    .end(function (err, res) {
                        should.not.exist(err);
                        res.text.should.containEql(support_answer.title); 
                        done();
                    });
                });
            });

            it('Should create a reject answer to question '+question_id, function(done){
                global_accounts.basic_agent.post('/crisis/1/question/'+question_id+'/answers')
                .send(reject_answer)
                .expect('Content-Type', /text/)
                .expect(302)
                .expect('Location', '/crisis/1/question/'+question_id)
                .end(function(err, res){
                    if(err) throw err;
                    request(app).get('/crisis/1/question/'+question_id)
                    .expect('Content-Type', /text/)
                    .expect(200)
                    .end(function (err, res) {
                        should.not.exist(err);
                        res.text.should.containEql(reject_answer.title); 
                        done();
                    });
                });
            });

            it('should upvote answer', function (done) {
                global_db.models.post.find({title: support_answer.title}, function (err, result) {
                    should.not.exist(err);
                    var post = result[0];
                    post.getAnswers(function (err, answers) {
                        should.not.exist(err);
                        var answer = answers[0];
                        global_accounts.basic_agent
                        .post('/crisis/1/question/'+question_id+'/answer/'+answer.id+'/upvote')
                        .send()
                        .expect(200)
                        .end(function (err, res) {
                            should.not.exist(err);
                            res.body.post.upvoteCount.should.be.exactly(1);
                            res.body.post.downvoteCount.should.be.exactly(0);
                            done();
                        });
                    });
                });
            });

            it('should downvote answer', function (done) {
                global_db.models.post.find({title: support_answer.title}, function (err, result) {
                    should.not.exist(err);
                    var post = result[0];
                    post.getAnswers(function (err, answers) {
                        should.not.exist(err);
                        var answer = answers[0];
                        global_accounts.basic_agent
                        .post('/crisis/1/question/'+question_id+'/answer/'+answer.id+'/downvote')
                        .send()
                        .expect(200)
                        .end(function (err, res) {
                            should.not.exist(err);
                            res.body.post.upvoteCount.should.be.exactly(0);
                            res.body.post.downvoteCount.should.be.exactly(1);
                            done();
                        });
                    });
                });
            });

        });

    });
});

