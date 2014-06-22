var should  = require('should'),
    request = require('supertest'),
    test_utils = require('./utils.js');

var app,
    global_db;

describe('Index', function(){
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

    describe('get /', function(){
        it('Respond with a page', function(done){
            request(app).get('/')
                .expect('Content-Type', /text/)
                .expect(200)
                .end(function(err, res){
                    if(err) throw err;
                    //console.log('app= ', app);
                    done();
                });
        });
    });
});

require('./crisis/crisis-test.js');




