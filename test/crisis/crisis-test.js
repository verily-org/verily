var should  = require('should'),
    request = require('supertest'),
    test_utils = require('../utils.js'),
    async = require('async');

var app,
    global_db,
    global_accounts;

describe('Crisis', function(){

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


    describe('get /create', function(){
        it('Should return 403 Forbidden when non-users try to access Crisis create page', function(done){
            request(app).get('/crisis/create')
                .expect('Content-Type', /text/)
                .expect(403)
                .end(function(err, res){
                    if(err) throw err;
                    done();
                });
        });
    });

    describe('(Agents', function(){
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
            //Clear all the database
            test_utils.drop_db(global_db, done);
        });
        describe('get /create', function(){

            it('Should return 403 Forbidden when basic users try to access Crisis create page', function(done){
                global_accounts.basic_agent.get('/crisis/create')
                    .expect('Content-Type', /text/)
                    .expect(403)
                    .end(function(err, res){
                        if(err) throw err;
                        done();
                    });
            });
            it('Should grant access to create page to editors', function(done){
                global_accounts.editor_agent.get('/crisis/create')
                    .expect('Content-Type', /text/)
                    .expect(200)
                    .end(function(err, res){
                        if(err) throw err;
                        done();
                    });
            });
        });
        describe('post /crisis', function(){
            it('Should return a status code 500 when a Crisis with wrong targetDateTimeOccurred is sent', function(done){
                var crisis_post_1 = {
                    title : "Crisis title",
                    targetDateTimeOccurred: new Date()
                }
                global_accounts.editor_agent.post('/crisis').send(crisis_post_1)
                    .expect(500)
                    .end(function(err, res){
                        if(err) throw err;
                        done();
                    });
            });
            it('Should return 403 Forbidden when a basic user requests Crisis creation', function(done){
                var crisis_post_1 = {
                    title : "Crisis title",
                    targetDateTimeOccurred: [10, 2, 2014, 10, 20]
                }
                global_accounts.basic_agent.post('/crisis').send(crisis_post_1)
                    .expect(403)
                    .end(function(err, res){
                        if(err) throw err;
                        done();
                    });
            });
            it('Should create a crisis with the user relation set and redirect to the created Crisis Page', function(done){
                var crisis_post_1 = {
                    title : "Crisis title created by "+global_accounts.editor_user.name,
                    targetDateTimeOccurred: [10, 2, 2014, 10, 20]
                }
                global_accounts.editor_agent.post('/crisis').send(crisis_post_1)
                    .expect('Content-Type', /text/)
                    .expect(302)
                    .expect('Location', /crisis\/[0-9]/)
                    .end(function(err, res){
                        if(err) throw err;
                        global_db.models.post.find({title: crisis_post_1.title}, function (err, result) {
                            if(err) throw err;
                            var post = result[0];
                            post.getCrisis(function(err, crisis){
                                if(err) throw err;
                                post.should.have.property('title', crisis_post_1.title);
                                post.getUser(function(err, user){
                                    if(err) throw err;
                                    post.user.should.have.property('name',  global_accounts.editor_user.name);
                                    done();
                                });
                            });
                        });
                    });
            });
        });
        describe('Specific crisis', function(){
            var crisis_post = {
                title : "Test Crisis title",
                targetDateTimeOccurred: [10, 2, 2014, 10, 20]
            };
            beforeEach(function(done){
                //Add 1 crisis using the app
                global_accounts.editor_agent.post('/crisis').send(crisis_post)
                    .expect('Content-Type', /text/)
                    .expect(302)
                    .expect('Location', /crisis\/[0-9]/)
                    .end(function(err, res){
                        if(err) throw err;
                        done();
                    });
            });
            afterEach(function(done){
                //Clear crisis and post table
                global_db.models.crisis.clear(function(err){
                    if(err) throw err;
                    global_db.models.post.clear(done);
                });
            });

            describe('GET crisis/{id}', function(){
                it('Should return a Crisis page', function(done){
                    global_db.models.post.find({title: crisis_post.title}, function(err, result){
                        if(err) throw err;
                        var post_result = result[0];
                        post_result.getCrisis(function(err, crisis){
                            if(err) throw err;
                            request(app).get('/crisis/'+crisis[0].id)
                                .expect('Content-Type', /text/)
                                .expect(200)
                                .end(function(err, res){
                                    if(err) throw err;
                                    done();
                                });
                        })
                    });
                });
            });
            describe('POST crisis/{id}/markImportant', function(){
                it('Should not allow non-users to mark important', function(done){
                    global_db.models.post.find({title: crisis_post.title}, function(err, result){
                        if(err) throw err;
                        var post_result = result[0];
                        post_result.getCrisis(function(err, crisis){
                            if(err) throw err;
                            request(app).post('/crisis/'+crisis[0].id+'/markImportant')
                                .expect('Content-Type', /text/)
                                .expect(403)
                                .end(function(err, res){
                                    if(err) throw err;
                                    //console.log('res.header= ', res.header);
                                    done();
                                });
                        });
                    });
                });
            });
        });
    });

});

