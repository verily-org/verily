var should  = require('should'),
    request = require('supertest'),
    test_utils = require('../utils.js'),
    async = require('async');

var app,
    global_db,
    global_accounts;

describe('Accounts', function(){
    before(function(done){
        this.timeout(10000);
        //Ensure the connection is made before testings begin
        test_utils.run_app(function(application, db){
            app = application;
            global_db = db;
            done();
        });
    });

    after(function(done){
        this.timeout(10000);
        //Clear all the database
        test_utils.drop_db(global_db, done);
    });


    var user1 = {
            email : 'asde@hotmail.com',
            name : 'asde.asde',
            password : 'admin1',
            verifyPassword : 'admin1'
        };

    describe('Local user account creation (POST /user)', function(){

        it('Should create 1 user and redirect to the previous page', function(done){
            request(app).post('/user').send(user1)
                .expect('Content-Type', /text/)
                .expect(302)
                .expect('Location', '/')
                .end(function(err, res){
                    if(err) throw err;
                    done();
                });
        });
    });
    describe('(Agents)', function(){

        //agents to save session cookies in order to test users and authenticated requests
        before(function(done){
            this.timeout(10000);
            test_utils.set_users_agents_account(request, app, global_db, function(accounts){
                global_accounts = accounts;
                done();
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
                        if(err) throw err;
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
                        if(err) throw err;
                        console.log('res.tex get user= ', res.text);
                        //console.log('user register res= ', res);
                        done();
                    });
            });
        });

        describe('Account Login (POST /login)', function(){
            it('Should login as Admin and redirect to the previous page', function(done){
                request(app).post('/login').send(global_accounts.admin_user)
                    .expect('Content-Type', /text/)
                    .expect('set-cookie', /connect.sid=/)
                    .expect(302)
                    .expect('Location', '/')
                    .end(function(err, res){
                        if(err) throw err;
                        done();
                    });
            });
            it('Should login as editor and redirect to the previous page', function(done){
                request(app).post('/login').send(global_accounts.editor_user)
                    .expect('Content-Type', /text/)
                    .expect('set-cookie', /connect.sid=/)
                    .expect(302)
                    .expect('Location', '/')
                    .end(function(err, res){
                        if(err) throw err;
                        done();
                    });
            });
            it('Should login as basic user and redirect to the previous page', function(done){
                request(app).post('/login').send(global_accounts.basic_user)
                    .expect('Content-Type', /text/)
                    .expect('set-cookie', /connect.sid=/)
                    .expect(302)
                    .expect('Location', '/')
                    .end(function(err, res){
                        if(err) throw err;
                        done();
                    });
            });
        });
    });

});
