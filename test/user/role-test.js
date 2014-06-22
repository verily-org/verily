var should  = require('should'),
    request = require('supertest'),
    test_utils = require('../utils.js'),
    async = require('async');

var app,
    global_db,
    global_accounts;


describe('Roles', function(){

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

    describe('(Agents)', function(){

        //agents to save session cookies in order to test users and authenticated requests
        before(function(done){
            this.timeout(10000);
            test_utils.set_users_agents_account(request, app, global_db, function(accounts){
                global_accounts = accounts;
                done();
            });
        });

        var user1 = {
                email : 'asde@hotmail.com',
                name : 'asde.asde',
                password : 'admin1',
                verifyPassword : 'admin1'
            },
            user2 = {
                email : 'asde2@hotmail.com',
                name : 'asde2',
                password : 'admin1',
                verifyPassword : 'admin1'
            };
        describe('post /admin', function(){
            beforeEach(function(done){
                //Add 2 users using the app
                request(app).post('/user').send(user1)
                    .expect('Content-Type', /text/)
                    .expect(302)
                    .expect('Location', '/')
                    .end(function(err, res){
                        if(err) throw err;
                        request(app).post('/user').send(user2)
                            .expect('Content-Type', /text/)
                            .expect(302)
                            .expect('Location', '/')
                            .end(function(err, res){
                                if(err) throw err;
                                done();
                            });
                    });
            });
            afterEach(function(done){
                //Remove both users, can't clear the model because of the global_accounts used in other tests
                global_db.models.local.find({email: user1.email}, function(err, result){
                    if(err) throw err;
                    result[0].remove(function(err, result){
                        if(err) throw err;
                        global_db.models.user.find({name: user1.name}, function(err, result){
                            if(err) throw err;
                            result[0].remove(function(err, result){
                                if(err) throw err;
                                global_db.models.local.find({email: user2.email}, function(err, result){
                                    if(err) throw err;
                                    result[0].remove(function(err, result){
                                        if(err) throw err;
                                        global_db.models.user.find({name: user2.name}, function(err, result){
                                            if(err) throw err;
                                            result[0].remove(function(err, result){
                                                if(err) throw err;
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

            it('Should return 403 Forbidden to non-Admin users', function(done){
                var body = {
                    basics: user2.name,
                    editors: user1.name,
                    admins : 'Admin'
                }
                global_accounts.editor_agent.post('/admin').send(body)
                    .expect('Content-Type', /text/)
                    .expect(403)
                    .end(function(err, res){
                        if(err) throw err;
                        done();
                    });
            });
            it('Should change role of a user (even with a "." on its name) from basic to editor', function(done){
                var body = {
                    basics: user2.name,
                    editors: user1.name,
                    admins : 'Admin'
                }
                global_accounts.admin_agent.post('/admin').send(body)
                    .expect('Content-Type', /text/)
                    .expect(200)
                    .end(function(err, res){
                        if(err) throw err;
                        global_db.models.user.find({name: user1.name}, function (err, result) {
                            if(err) throw err;
                            var user = result[0];
                            user.should.have.property('role', 'editor');
                        });
                        done();
                    });
            });
        });
    });

});