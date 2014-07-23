var should  = require('should'),
    request = require('supertest'),
    test_utils = require('../utils.js'),
    async = require('async');

var app,
    global_db,
    crisis_post,
    global_accounts,
    global_question,
    global_answer,
    global_anon_agent;

var my_comment = {
    text: 'This is my only comment!'
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

var question_id = getRandomInt(0, 79);


describe('Comments', function(){

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
        before('Create users, a crisis, a question and an answer', function(done){
            this.timeout(10000);
            test_utils.set_users_agents_account(request, app, global_db, function (accounts){
                global_accounts = accounts;
                var editor_agent = global_accounts.editor_agent;
                var user = global_accounts.editor_user;
                //create a crisis
                test_utils.create_crisis(user, editor_agent, global_db, function (crisis) {
                    crisis_post = crisis;
                    var admin_agent = global_accounts.admin_agent;
                    test_utils.create_question(admin_agent, global_db, function (question) {
                        global_question = question;
                        test_utils.set_anon_agent(request, app, global_db, function (anon_agent, answer) {
                            global_anon_agent = anon_agent;
                            global_answer = answer;
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

        describe('Post to crisis/1/question/1/answer/1/comments', function(){
            this.timeout(10000);
            it('Should create a comment to answer 1', function (done){
                global_accounts.basic_agent
                .post('/crisis/1/question/'+global_question.id+'/answer/'+global_answer.id+'/comments')
                .send(my_comment)
                .expect('Content-Type', /text/)
                .expect(302)
                .expect('Location', '/crisis/1/question/'+global_question.id+'/answer/'+global_answer.id)
                .end(function(err, res){
                    if(err) throw err;
                    request(app).get('/crisis/1/question/'+global_question.id+'/answer/'+global_answer.id)
                    .expect('Content-Type', /text/)
                    .expect(200)
                    .end(function (err, res) {
                        should.not.exist(err);
                        res.text.should.containEql(my_comment.text); 
                        done();
                    });
                });
            });

        });

    });
});

