var should  = require('should'),
    request = require('supertest'),
    test_utils = require('../utils.js'),
    async = require('async');

var app,
    global_db,
    crisis_post,
    global_accounts;

var questions_file = {
    key: 'static/backups/questions/crisis-1.json'
};

var question_post_1 = {
    title : "Why am I here?",
    targetDateTimeOccurred: [10, 2, 2014, 10, 20]
};


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
        before('Create users and a crisis', function(done){
            this.timeout(10000);
            test_utils.set_users_agents_account(request, app, global_db, function(accounts){
                global_accounts = accounts;
                var agent = global_accounts.editor_agent;
                var user = global_accounts.editor_user;
                //create a crisis
                test_utils.create_crisis(user, agent, global_db, function (crisis) {
                    crisis_post = crisis;
                    done();
                });
            });
        });

        after('clear the database', function(done){
            this.timeout(10000);
            //Clear all the database
            test_utils.drop_db(global_db, done);
        });

        describe('get crisis/1/question/create', function(){
            it('Should return 403 Forbidden when non-users try to access question create page', function(done){
                request(app).get('/crisis/1/question/create')
                    .expect('Content-Type', /text/)
                    .expect(403)
                    .end(function(err, res){
                        should.not.exist(err);
                        done();
                    });
            });

            it('Should return 403 Forbidden when non-users try to access questions create page', function(done){
                request(app).get('/crisis/1/questions/create')
                    .expect('Content-Type', /text/)
                    .expect(403)
                    .end(function(err, res){
                        should.not.exist(err);
                        done();
                    });
            });

            it('Should return 403 Forbidden when basic users try to access question create page', function(done){
                global_accounts.basic_agent.get('/crisis/1/question/create')
                    .expect('Content-Type', /text/)
                    .expect(403)
                    .end(function(err, res){
                        should.not.exist(err);
                        done();
                    });
            });

            it('Should return 403 Forbidden when basic users try to access questions create page', function(done){
                global_accounts.basic_agent.get('/crisis/1/questions/create')
                    .expect('Content-Type', /text/)
                    .expect(403)
                    .end(function(err, res){
                        should.not.exist(err);
                        done();
                    });
            });

            it('Should grant access to create page to editors', function(done){
                global_accounts.editor_agent.get('/crisis/1/question/create')
                    .expect('Content-Type', /text/)
                    .expect(200)
                    .end(function(err, res){
                        should.not.exist(err);
                        done();
                    });
            });

            it('Should return 403 Forbidden when editor users try to access questions create page', function(done){
                global_accounts.editor_agent.get('/crisis/1/questions/create')
                    .expect('Content-Type', /text/)
                    .expect(403)
                    .end(function(err, res){
                        should.not.exist(err);
                        done();
                    });
            });

            it('Should grant access to create page to admins', function(done){
                global_accounts.admin_agent.get('/crisis/1/question/create')
                    .expect('Content-Type', /text/)
                    .expect(200)
                    .end(function(err, res){
                        should.not.exist(err);
                        done();
                    });
            });

            it('Should grant access to questions create page to admins', function(done){
                global_accounts.admin_agent.get('/crisis/1/questions/create')
                    .expect('Content-Type', /text/)
                    .expect(200)
                    .end(function(err, res){
                        should.not.exist(err);
                        done();
                    });
            });
        });
        describe('post /crisis/1/question', function(){
            /*it('Should return a status code 500 when a Crisis with wrong targetDateTimeOccurred is sent', function(done){
                var crisis_post_1 = {
                    title : "Crisis title",
                    targetDateTimeOccurred: new Date()
                }
                global_accounts.editor_agent.post('/crisis').send(crisis_post_1)
                    .expect(500)
                    .end(function(err, res){
                        should.not.exist(err);
                        done();
                    });
            });*/
            it('Should return 403 Forbidden when a basic user requests question creation', function(done){
                var crisis_post_1 = {
                    title : "Crisis title",
                    targetDateTimeOccurred: [10, 2, 2014, 10, 20]
                }
                global_accounts.basic_agent.post('/crisis/1/question').send(crisis_post_1)
                    .expect(403)
                    .end(function(err, res){
                        should.not.exist(err);
                        done();
                    });
            });
            it('Should return 403 Forbidden when a basic user requests questions creation', function(done){
                global_accounts.basic_agent.post('/crisis/1/questions/create').send(questions_file)
                    .expect(403)
                    .end(function(err, res){
                        should.not.exist(err);
                        done();
                    });
            });
            it('Should return 403 Forbidden when an editor user requests questions creation', function(done){
                global_accounts.editor_agent.post('/crisis/1/questions/create').send(questions_file)
                    .expect(403)
                    .end(function(err, res){
                        should.not.exist(err);
                        done();
                    });
            });
        });
        describe('Specific question', function(){
            before('create a question', function (done) {
                global_accounts.editor_agent.post('/crisis/1/question').send(question_post_1)
                .expect('Content-Type', /text/)
                .expect(302)
                .expect('Location', /crisis\/1\/question\/[0-9]/)
                .end(function(err, res){
                    should.not.exist(err);
                    global_db.models.post.find({title: question_post_1.title}, function (err, result) {
                        should.not.exist(err);
                        var post = result[0];
                        post.getQuestions(function(err, question){
                            should.not.exist(err);
                            post.should.have.property('title', question_post_1.title);
                            post.getUser(function(err, user){
                                should.not.exist(err);
                                user.should.have.property('name',  global_accounts.editor_user.name);
                                done();
                            });
                        });
                    });
                });
            });

            


            it('Should return a question page', function(done){
                global_db.models.post.find({title: question_post_1.title}, function(err, result){
                    should.not.exist(err);
                    var post_result = result[0];
                    post_result.should.have.property('title', question_post_1.title);
                    post_result.getQuestions(function(err, question){
                        should.not.exist(err);
                        request(app).get('/crisis/1/question/'+question[0].id)
                        .expect('Content-Type', /text/)
                        .expect(200)
                        .end(function(err, res){
                            should.not.exist(err);
                            res.text.should.containEql(question_post_1.title);  
                            done();
                        });
                    })
                });
            });

            
            it('Should update the question and return a question page', function(done){
                var updated_question_post = {
                    title: "New Question title"
                };

                global_db.models.post.find({title: question_post_1.title}, function(err, result){
                    should.not.exist(err);
                    var post_result = result[0];
                    post_result.should.have.property('title', question_post_1.title);
                    post_result.getQuestions(function(err, question){
                        should.not.exist(err);
                        global_accounts.editor_agent.post('/crisis/1/question/'+question[0].id)
                        .send(updated_question_post)
                        .expect('Content-Type', /text/)
                        .expect(302)
                        .expect('Location', '/crisis/1/question/'+question[0].id)
                        .end(function(err, res){
                            should.not.exist(err);
                            request(app).get('/crisis/1/question/'+question[0].id)
                            .expect('Content-Type', /text/)
                            .expect(200)
                            .end(function(err, res){
                                should.not.exist(err);
                                res.text.should.containEql(updated_question_post.title);  
                                done();
                            });
                        });
                    });
                });
            });
        });
        
        describe('Create bulk of questions', function () {
            this.timeout(10000);
            it('Should create 79 questions', function (done) {
                var agent = global_accounts.admin_agent;
                var db = global_db;
                test_utils.create_questions(agent, db, function (questions) {
                    done();
                });
            });

        });


    });
});

