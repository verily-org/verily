var should  = require('should'),
    request = require('supertest'),
    test_utils = require('../utils.js'),
    async = require('async');

var app,
    global_db,
    global_accounts,
    global_questions,
    global_answers,
    global_comment,
    global_basic_user;

var answers_data = [{
    title: 'This is my first answer',
    type: 'support'
}, {
    title: 'This is my second answer',
    type: 'reject'
}];

var comment_data = {
    text: 'This is my only comment!'
}

describe('Roles', function(){

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
        before(function(done){
            this.timeout(20000);
            test_utils.set_users_agents_account(request, app, global_db, function (accounts){
                global_accounts = accounts;
                global_db.models.user.find({name: global_accounts.basic_user.name}, function (err, result) {
                    should.not.exist(err);
                    global_basic_user = result[0];
                    var editor_agent = global_accounts.editor_agent;
                    var user = global_accounts.editor_user;
                    //create a crisis
                    test_utils.create_crisis(user, editor_agent, global_db, function (crisis) {
                        crisis_post = crisis;
                        var admin_agent = global_accounts.admin_agent;
                        test_utils.create_questions(admin_agent, global_db, function (questions) {
                            global_questions = questions;
                            done();
                        });
                    });
                });    
            });
        });

        var user1 = {
                email : 'asde@hotmail.com',
                name : 'asde.asde',
                password : 'admin123',
                verifyPassword : 'admin123',
                termsAgreement: true
            },
            user2 = {
                email : 'asde2@hotmail.com',
                name : 'asde2',
                password : 'admin123',
                verifyPassword : 'admin123',
                termsAgreement: true
            };
        describe('post /roles', function(){
            before(function(done){
                //Add 2 users using the app
                request(app).post('/user').send(user1)
                    .expect('Content-Type', /text/)
                    .expect(302)
                    .expect('Location', '/')
                    .end(function(err, res){
                        should.not.exist(err);
                        request(app).post('/user').send(user2)
                            .expect('Content-Type', /text/)
                            .expect(302)
                            .expect('Location', '/')
                            .end(function(err, res){
                                should.not.exist(err);
                                done();
                            });
                    });
            });
            after(function(done){
                //Remove both users, can't clear the model because of the global_accounts used in other tests
                global_db.models.local.find({email: user1.email}, function(err, result){
                    should.not.exist(err);
                    result[0].remove(function(err, result){
                        should.not.exist(err);
                        global_db.models.user.find({name: user1.name}, function(err, result){
                            should.not.exist(err);
                            result[0].remove(function(err, result){
                                should.not.exist(err);
                                global_db.models.local.find({email: user2.email}, function(err, result){
                                    should.not.exist(err);
                                    result[0].remove(function(err, result){
                                        should.not.exist(err);
                                        global_db.models.user.find({name: user2.name}, function(err, result){
                                            should.not.exist(err);
                                            result[0].remove(function(err, result){
                                                should.not.exist(err);
                                                done();
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });

            it('Should return 403 Forbidden to editor users', function(done){
                var body = {
                    basics: user2.name,
                    editors: user1.name,
                    admins : 'verily'
                }
                global_accounts.editor_agent.post('/roles').send(body)
                    .expect('Content-Type', /text/)
                    .expect(403)
                    .end(function(err, res){
                        should.not.exist(err);
                        done();
                    });
            });

            it('Should return 403 Forbidden to basic users', function(done){
                var body = {
                    basics: user2.name,
                    editors: user1.name,
                    admins : 'verily'
                }
                global_accounts.basic_agent.post('/roles').send(body)
                    .expect('Content-Type', /text/)
                    .expect(403)
                    .end(function(err, res){
                        should.not.exist(err);
                        done();
                    });
            });

            it('Should change role of a user (even with a "." on its name) from basic to editor', function(done){
                var body = {
                    basics: user2.name,
                    editors: user1.name,
                    admins : 'verily'
                }
                global_accounts.admin_agent.post('/roles').send(body)
                    .expect('Content-Type', /text/)
                    .expect(200)
                    .end(function(err, res){
                        should.not.exist(err);
                        global_db.models.user.find({name: user1.name}, function (err, result) {
                            should.not.exist(err);
                            var user = result[0];
                            user.should.have.property('role', 'editor');
                        });
                        done();
                    });
            });
        });

        describe('User content', function () {
            this.timeout(10000);
            before('Create answer and comment', function (done) {
                this.timeout(10000);
                global_accounts.basic_agent.post('/crisis/1/question/1/answers')
                .send(answers_data[0])
                .expect(302)
                .expect('Location', '/crisis/1/question/1')
                .end(function (err, res) {
                    should.not.exist(err);
                    global_accounts.basic_agent.post('/crisis/1/question/2/answers')
                    .send(answers_data[1])
                    .expect(302)
                    .expect('Location', '/crisis/1/question/2')
                    .end(function (err, res) {
                        should.not.exist(err);
                        global_db.models.answer.find({}, function (err, answers) {
                            should.not.exist(err);
                            global_answers = answers;
                            global_accounts.basic_agent
                            .post('/crisis/1/question/1/answer/'+global_answers[0].id+'/comments')
                            .send(comment_data)
                            .expect(302)
                            .expect('Location', '/crisis/1/question/1/answer/'+global_answers[0].id)
                            .end(function (err, res) {
                                should.not.exist(err);
                                global_db.models.comment.find({}, function (err, result) {
                                    should.not.exist(err);
                                    global_comment = result[0];
                                    done();
                                });
                            });
                        });
                    });
                });
            });

            it('Should hide the content posted by basic user', function (done) {
                var post_data = {
                    user_id: global_basic_user.id,
                    show: '0'
                };
                global_accounts.admin_agent.post('/editUserEvidenceShow')
                .send(post_data)
                .expect(302)
                .expect('Location', '/user/'+global_basic_user.id+'/userContentList')
                .end(function (err, res) {
                    should.not.exist(err);
                    request(app).get('/crisis/1/question/1')
                    .expect(200)
                    .end(function (err, res) {
                        should.not.exist(err);
                        res.text.should.not.containEql(answers_data[0].title);
                        request(app).get('/crisis/1/question/2')
                        .expect(200)
                        .end(function (err, res) {
                            should.not.exist(err);
                            res.text.should.not.containEql(answers_data[1].title);
                            done();
                        });
                    });
                });
            });

            it('Should show the hidden content posted by basic user', function (done) {
                var post_data = {
                    user_id: global_basic_user.id,
                    show: '1'
                };
                global_accounts.admin_agent.post('/editUserEvidenceShow')
                .send(post_data)
                .expect(302)
                .expect('Location', '/user/'+global_basic_user.id+'/userContentList')
                .end(function (err, res) {
                    should.not.exist(err);
                    request(app).get('/crisis/1/question/1')
                    .expect(200)
                    .end(function (err, res) {
                        should.not.exist(err);
                        res.text.should.containEql(answers_data[0].title);
                        request(app).get('/crisis/1/question/2')
                        .expect(200)
                        .end(function (err, res) {
                            should.not.exist(err);
                            res.text.should.containEql(answers_data[1].title);
                            request(app).get('/crisis/1/question/1/answer/'+global_answers[0].id)
                            .expect(200)
                            .end(function (err, res) {
                                should.not.exist(err);
                                res.text.should.containEql(comment_data.text);
                                done();    
                            });
                        });
                    });
                });
            });

            it('Should hide the comment posted by basic user', function (done) {
                var post_data = {
                    user_id: global_basic_user.id,
                    comment_id: global_comment.id,
                    show: '0'
                };
                global_accounts.admin_agent.post('/editCommentShow')
                .send(post_data)
                .expect(302)
                .expect('Location', '/user/'+global_basic_user.id+'/userContentList')
                .end(function (err, res) {
                    should.not.exist(err);
                    request(app).get('/crisis/1/question/1/answer/'+global_answers[0].id)
                    .expect(200)
                    .end(function (err, res) {
                        should.not.exist(err);
                        res.text.should.not.containEql(comment_data.text);
                        done();
                    });
                });
            });

            it('Should show the hidden comment posted by basic user', function (done) {
                var post_data = {
                    user_id: global_basic_user.id,
                    comment_id: global_comment.id,
                    show: '1'
                };
                global_accounts.admin_agent.post('/editCommentShow')
                .send(post_data)
                .expect(302)
                .expect('Location', '/user/'+global_basic_user.id+'/userContentList')
                .end(function (err, res) {
                    should.not.exist(err);
                    request(app).get('/crisis/1/question/1/answer/'+global_answers[0].id)
                    .expect(200)
                    .end(function (err, res) {
                        should.not.exist(err);
                        res.text.should.containEql(comment_data.text);
                        done();
                    });
                });
            });

            it('Should hide an answer posted by basic user', function (done) {
                var post_data = {
                    user_id: global_basic_user.id,
                    evidence_id: global_answers[1].id,
                    show: '0'
                };
                global_accounts.admin_agent.post('/editEvidenceShow')
                .send(post_data)
                .expect(302)
                .expect('Location', '/user/'+global_basic_user.id+'/userContentList')
                .end(function (err, res) {
                    should.not.exist(err);
                    request(app).get('/crisis/1/question/2')
                    .expect(200)
                    .end(function (err, res) {
                        should.not.exist(err);
                        res.text.should.not.containEql(answers_data[1].title);
                        done();
                    });
                });
            });

            it('Should show a hidden answer posted by basic user', function (done) {
                var post_data = {
                    user_id: global_basic_user.id,
                    evidence_id: global_answers[1].id,
                    show: '1'
                };
                global_accounts.admin_agent.post('/editEvidenceShow')
                .send(post_data)
                .expect(302)
                .expect('Location', '/user/'+global_basic_user.id+'/userContentList')
                .end(function (err, res) {
                    should.not.exist(err);
                    request(app).get('/crisis/1/question/2')
                    .expect(200)
                    .end(function (err, res) {
                        should.not.exist(err);
                        res.text.should.containEql(answers_data[1].title);
                        done();
                    });
                });
            });

        });

    });

});