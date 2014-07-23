var should  = require('should'),
    request = require('supertest'),
    test_utils = require('../utils.js'),
    async = require('async');

var app,
    global_db,
    crisis_post,
    global_accounts;

describe('Crisis', function(){

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


    describe('get /create', function(){
        it('Should return 403 Forbidden when non-users try to access Crisis create page', function(done){
            request(app).get('/crisis/create')
                .expect('Content-Type', /text/)
                .expect(403)
                .end(function(err, res){
                    should.not.exist(err);
                    done();
                });
        });
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
                        should.not.exist(err);
                        done();
                    });
            });
            it('Should grant access to create page to editors', function(done){
                global_accounts.editor_agent.get('/crisis/create')
                    .expect('Content-Type', /text/)
                    .expect(200)
                    .end(function(err, res){
                        should.not.exist(err);
                        done();
                    });
            });
        });
        describe('post /crisis', function(){
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
            it('Should return 403 Forbidden when a basic user requests Crisis creation', function(done){
                var crisis_post_1 = {
                    title : "Crisis title",
                    targetDateTimeOccurred: [10, 2, 2014, 10, 20]
                }
                global_accounts.basic_agent.post('/crisis').send(crisis_post_1)
                    .expect(403)
                    .end(function(err, res){
                        should.not.exist(err);
                        done();
                    });
            });
        });
        describe('Specific crisis', function(){
            it('Should return a Crisis page', function(done){
                global_db.models.post.find({title: crisis_post.title}, function(err, result){
                    should.not.exist(err);
                    var post_result = result[0];
                    post_result.should.have.property('title', crisis_post.title);
                    post_result.getCrisis(function(err, crisis){
                        should.not.exist(err);
                        request(app).get('/crisis/1')
                        .expect('Content-Type', /text/)
                        .expect(200)
                        .end(function(err, res){
                            should.not.exist(err);
                            res.text.should.containEql(crisis_post.title);
                            done();
                        });
                    })
                });
            });

            
            it('Should update the crisis and return a Crisis page', function(done){
                var updated_crisis_post = {
                    title: "New title"
                };

                global_accounts.editor_agent.post('/crisis/1')
                .send(updated_crisis_post)
                .expect('Content-Type', /text/)
                .expect(302)
                .expect('Location', '/crisis/1')
                .end(function(err, res){
                    should.not.exist(err);
                    request(app).get('/crisis/1')
                    .expect('Content-Type', /text/)
                    .expect(200)
                    .end(function(err, res){
                        should.not.exist(err);
                        res.text.should.containEql(updated_crisis_post.title);
                        done();
                    });
                });
            });
        });
    });
});

