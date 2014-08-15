var should  = require('should'),
    request = require('supertest'),
    test_utils = require('../utils.js'),
    async = require('async');

var app,
    global_db,
    global_accounts,
    anon,
    global_user,
    reset_token,
    new_user_agent;


describe('Accounts', function(){
    before(function (done){
        this.timeout(10000);
        //Ensure the connection is made before testings begin
        test_utils.run_app(function (application, db) {
            console.log('App started');
            app = application;
            global_db = db;
            anon = request.agent(app);
            new_user_agent = request.agent(app);
            done();
        });
    });

    after(function(done){
        this.timeout(10000);
        //Clear all the database
        test_utils.end_test(global_db, done);
    });


    var user1 = {
        email : 'asde@hotmail.com',
        name : 'asde.asde',
        password : 'admin123',
        verifyPassword : 'admin123',
        termsAgreement: true
    };

    var updated_user1 = {
        name: 'newName',
        password: '123qwe'
    }

    describe('Local user account creation (POST /user)', function(){
        this.timeout(10000);
        it('Should create 1 user and redirect to the previous page', function(done){
            new_user_agent.post('/user').send(user1)
                .expect('Content-Type', /text/)
                .expect(302)
                .expect('Location', '/')
                .end(function(err, res){
                    should.not.exist(err);
                    done();
                });
        });

        it('Should change the user\'s password', function (done) {
            var post_data = {
                old_password: user1.password,
                new_password: updated_user1.password,
                confirm_password: updated_user1.password
            };
            new_user_agent.post('/changePass').send(post_data)
            .expect(302)
            .expect('Location', '/user')
            .end(function (err, res) {
                should.not.exist(err);
                done();
            });
        });

        it('Should login with the new password', function (done) {
            var user_data = {
                email: user1.email,
                password: updated_user1.password
            };

            request(app).post('/login')
            .send(user_data)
            .expect(302)
            .expect('Location', '/')
            .end(function (err, res) {
                should.not.exist(err);
                done();
            });
        });

        it('Should change the user\'s username', function (done) {
            var post_data = {
                username: updated_user1.name
            };
            new_user_agent.post('/changeUsername').send(post_data)
            .expect(302)
            .expect('Location', '/user')
            .end(function (err, res) {
                should.not.exist(err);
                done();
            });
        });

        it('Should show the new username', function (done) {
            new_user_agent.get('/user')
            .expect(200)
            .end(function (err, res) {
                should.not.exist(err);
                res.text.should.containEql(updated_user1.name);
                done();
            });
        });

    });
    describe('(Agents)', function(){

        //agents to save session cookies in order to test users and authenticated requests
        before(function(done){
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
                        done();
                    });
                });
            });
        });
        after(function(done){
            this.timeout(10000);
            test_utils.clear_account_models( global_db, function(){
                done();
            });
        });

        describe('Local user account creation (POST /user)', function(){
            it('Should redirect to login because of email had been taken', function(done){
                request(app).post('/user').send(global_accounts.basic_user)
                .expect('Content-Type', /text/)
                .expect(302)
                .expect('Location', '/register')
                .end(function(err, res){
                    should.not.exist(err);
                    done();
                });
            });
        });

        describe('User account profile (GET /user)', function(){

            //todo: Test cases for other situations in account profile
            //Currently a json response, should be changed
            it('Should show the user profile', function(done){
                global_accounts.editor_agent.get('/user')
                .expect('Content-Type', /text/)
                .expect(200)
                .end(function(err, res){
                    should.not.exist(err);
                    done();
                });
            });

        });

        describe('Account Login (POST /login)', function(){
            it('Should login as Admin and redirect to the previous page', function(done){
                request(app).post('/login').send(global_accounts.admin_user)
                .expect('Content-Type', /text/)
                //.expect('set-cookie', /connect.sid=/)
                .expect(302)
                .expect('Location', '/')
                .end(function(err, res){
                    should.not.exist(err);
                    done();
                });     
            });

            it('Should login as editor and redirect to the previous page', function(done){
                request(app).post('/login').send(global_accounts.editor_user)
                .expect('Content-Type', /text/)
                //.expect('set-cookie', /connect.sid=/)
                .expect(302)
                .expect('Location', '/')
                .end(function(err, res){
                    should.not.exist(err);
                    done();
                });
            });

            it('Should login as basic user and redirect to the previous page', function(done){
                request(app).post('/login').send(global_accounts.basic_user)
                .expect('Content-Type', /text/)
                //.expect('set-cookie', /connect.sid=/)
                .expect(302)
                .expect('Location', '/')
                .end(function(err, res){
                    should.not.exist(err);
                    done();
                });
            });

        });

        describe('Anonymous user', function () {

            it('Should get /crisis/1 in order to log in anonymous user', function (done) {
                anon.get('/crisis/1')
                .expect(200)
                .end(function (err, res) {
                    should.not.exist(err);
                    should.exist(res.headers['set-cookie']);
                    done();
                });
            });

            it('Should get the user profile of the anonymous user', function (done) {
                anon.get('/user')
                .expect(200)
                .end(function (err, res) {
                    should.not.exist(err);
                    done();
                });
            });

        });

        describe('Forgotten password', function () {

            it('POST to /forgot should generate reset token', function (done) {
                request(app).post('/forgot')
                .send({email: global_accounts.basic_user.email})
                .expect(302)
                .expect('Location', '/forgot')
                .end(function (err, res) {
                    should.not.exist(err);
                    global_db.models.local.find({email: global_accounts.basic_user.email}, function (err, result) {
                        should.not.exist(err);
                        var local = result[0];
                        should.exist(local.resetPasswordToken);
                        reset_token = local.resetPasswordToken;
                        done();
                    });
                });
            });

            it('Should allow the user to see the view create new password', function (done) {
                request(app).get('/reset/'+reset_token)
                .expect(200)
                .end(function (err, res) {
                    should.not.exist(err);
                    res.text.should.containEql('Reset Password');
                    done();
                });
            });

            it('Should not allow the user to see the view create new password', function (done) {
                request(app).get('/reset/12345')
                .expect(302)
                .expect('Location', '/forgot')
                .end(function (err, res) {
                    should.not.exist(err);
                    done();
                });
            });

            it('Should create a new password for the basic user', function (done) {
                var post_data = {
                    token: reset_token,
                    password: '123qwe',
                    confirm: '123qwe'
                };

                request(app).post('/reset').send(post_data)
                .expect(302)
                .expect('Location', '/user')
                .end(function (err, res) {
                    should.not.exist(err);
                    done();
                });
            });

            it('Should login with the new password', function (done) {
                var user_data = {
                    email: global_accounts.basic_user.email,
                    password: '123qwe'
                }

                request(app).post('/login')
                .send(user_data)
                .expect(302)
                .expect('Location', '/')
                .end(function (err, res) {
                    should.not.exist(err);
                    done();
                });
            });

        });

        describe('Control users', function () {
            before('Get user', function (done) {
                global_db.models.user.find({name: global_accounts.basic_user.name}, function (err, result) {
                    should.not.exist(err);
                    global_user = result[0];
                    done();
                });
            });

            it('Should ban the basic user', function (done) {
                var banned_user = {
                    user_id: global_user.id,
                    active: '0'
                };

                global_accounts.admin_agent.post('/banUser')
                .send(banned_user)
                .expect(302)
                .expect('Location', '/banUser')
                .end(function (err, res) {
                    should.not.exist(err);
                    global_db.models.user.get(global_user.id, function (err, user) {
                        should.not.exist(err);
                        user.active.should.be.eql(0);
                        done();
                    });
                });
            });

            it('Should unban the basic user', function (done) {
                var banned_user = {
                    user_id: global_user.id,
                    active: '1'
                };

                global_accounts.admin_agent.post('/banUser')
                .send(banned_user)
                .expect(302)
                .expect('Location', '/banUser')
                .end(function (err, res) {
                    should.not.exist(err);
                    global_db.models.user.get(global_user.id, function (err, user) {
                        should.not.exist(err);
                        user.active.should.be.eql(1);
                        done();
                    });
                });
            });

        });
    });

});
