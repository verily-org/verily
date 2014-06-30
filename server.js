// test
module.exports = function (suppressLogs) {
    var //fs = require('fs'),
        connect = require('connect'),
        express = require('express'),
        orm = require('orm'),
        app = express(),
        emitter = require('./event-emitter')(),
        swig = require('swig'),
        passport = require('passport'),
        flash = require('connect-flash'),
        http = require('http'),
        roles = require('./lib/roles'),
        swigHelpers = require('./helpers/swig'),
        enums = require('./enums'),
        router = require('./routing/router'),
        log = require('./log'),
        ORMSessionStore = require('./orm-session-store')(express),
        controllers = {},
        heroku,
        syncedModels,
        db_url;

    //initial log functions.
    log.init(enums);

    controllers.questions = require('./controllers/questions');
    controllers.question_comments = require('./controllers/question_comments');
    controllers.answers = require('./controllers/answers');
    controllers.answer_comments = require('./controllers/answer_comments');
    controllers.users = require('./controllers/users');
    controllers.ratings = require('./controllers/ratings');
    controllers.crises = require('./controllers/crises');



    app.use(connect.urlencoded());
    app.use(connect.json());
    
    // To allow use of all HTTP methods in the browser through use of _method variable
    app.use(express.methodOverride());

    app.set('port', process.env.PORT || enums.options.port);
    
    app.engine('html', swig.renderFile);
    app.set('view engine', 'html');
    app.set('views', __dirname + '/views');
    // Swig will cache templates for you, but you can disable
    // that and use Express's caching instead, if you like:
    app.set('view cache', false);
    // To disable Swig's cache, do the following:
    swig.setDefaults({ cache: false });
    // NOTE: You should always cache templates in a production environment.
    // Don't leave both of these to `false` in production!
    
    // Set up swig helpers for compilation/rendering pages.
    swigHelpers(swig);
    
    // Static file handling
    // app.use(express.static(__dirname + '/static'));
    
    app.use('/static', express.static('static'));


    //prevent big package and return 413 error
    // app.use(connect.limit('5kb'));
    app.use(connect.limit('10mb'));

    // Overwrite demo.sh at the start of execution because it is appended to.
    //if (enums.document) {
    //    fs.writeFile(enums.demo, '#!/bin/bash\n\n', function (err) {
    //        if (err) {
    //            throw err;
    //        }
    //    });
    //}

    heroku = (process.env.HEROKU_POSTGRESQL_BLACK_URL !== undefined);
    //heroku = false;
    //heroku = (process.env.HEROKU_POSTGRESQL_JADE_URL !== undefined);
    //console.log('process.env',process.env);
    if (heroku){
    	db_url = process.env.HEROKU_POSTGRESQL_BLACK_URL;
    } else {
    	db_url = "sqlite://app.db";
        
    }
    console.log('db_url:', db_url);
    
    // Set up the ORM to SQLite.
    app.use(orm.express(db_url, {
        define: function (db, models, next) {

            // Instance.cache is an important setting.
            // By default the cache is enabled but this means
            // that fields set not in the create() function will not be
            // picked up by the model (all fields successfully save into DB).
            db.settings.set('instance.cache', false);

            db.load("./models", function (err) {
                if (err === null || err === undefined) {
                    if (!suppressLogs) {
                        console.logger.info('Model loaded');
                    }
                } else {
                    console.logger.error('Model loading failed:');
                    console.logger.error(err);
                }

                models.Crisis = db.models.crisis;
                models.Post = db.models.post;
                models.Question = db.models.question;
                models.Answer = db.models.answer;
                models.Comment = db.models.comment;
                models.QuestionComment = db.models.question_comment;
                models.AnswerComment = db.models.answer_comment;
                models.Rating = db.models.rating;
                models.User = db.models.user;
                models.Local = db.models.local;
                models.Facebook = db.models.facebook;
                models.Impression = db.models.impression;
                models.Referral = db.models.referral;
                models.Session = db.models.session;
                models.SocialEvent = db.models.socialEvent;

                models.Local.sync(function () {console.log("Local synced")});
                models.QuestionComment.sync(function () {console.log("QuestionComment synced")});
                models.AnswerComment.sync(function () {console.log("AnswerComment synced")});
                models.Crisis.sync(function () {console.log("Crisis synced")});
                models.Post.sync(function () {console.log("Post synced")});
                models.User.sync(function () {console.log("User synced")});
                models.Question.sync(function () {console.log("Question synced")});
                models.Answer.sync(function () {console.log("Answer synced")});
                models.Rating.sync(function () {console.log("Rating synced")});
                models.Facebook.sync(function () {console.log("Facebook synced")});
                models.Impression.sync(function () {console.log("Impression synced")});
                models.Referral.sync(function () {console.log("Referral synced")});
                models.Session.sync(function () {console.log("Session synced")});
                models.SocialEvent.sync(function () {console.log("SocialEvent synced")});

                // Post is the base class.
                // Questions, answers and comments are types of Post.

                db.sync(function () {
                    syncedModels = models;
                    emitter.emit('model-synced');
                    if (!suppressLogs) {
                        console.logger.info("Model synchronised");
                    }
                                        
                });
            });
            next();
        }
    }));
    
    // /r/<referral path>
    var referralPathFormat  = /\/r\/([A-Za-z0-9_-]+)/;
    
    // Association setting with fallback.
    // methodName e.g. setUser used for some, setAuthor used otherwise.
    function setUserOfInstance(createdInstance, user, callback) {
        if (!user) {
            callback();
        } else {
            createdInstance.setUser(user, function (err) {
                if (err) {
                    console.log(err);
                }
                callback();
            }); 
        }
    }
    
    // Express middleware for analytics
    var analytics = function(req, res, next) {

        var impression = {
            path: req.path,
            requestMethod: req.method,
            date: new Date(Date.now()),
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            httpRefererUrl: req.headers['referer']
        }
                
        function setReferralOfImpression(createdImpression, refCode, callback) {
            if (!refCode) {
                callback();
            } else {
                req.models.Referral.find({
                    refCode: refCode
                }, 1, function(err, referrals) {
                    if (err) {
                        console.log(err);
                        callback();
                    } else if (referrals) {
                        var referral = referrals[0];
                        console.log('referral in set');
                        console.log(referral)
                        createdImpression.setReferral(referral, function (err) {
                           if (err) {
                               console.log(err);
                           }
                           callback();
                   
                       });
                    }
 
               });
            }
        }
        
        // req.user is only defined if user is logged in.
        var user = req.user;
        
        // If this is a generated referral path being requested, redirect to the path intended.
        var refPath = referralPathFormat.exec(impression.path);
        
        // If the user arrives via a referral code with a GET (not a registration of a refcode via POST/PUT).
        // We do not want to create an impression for the PUT to a /r/ path because the referral won't exist yet.
        if (refPath && req.method.toLowerCase() === 'get') {
            var refCode = refPath[1];
            // Referral short link
            req.models.Referral.find({
                refCode: refCode
            }, 1, function(err, referrals) {
                var referral = referrals[0];
                console.log('get referral');
                console.log(referral);
                if (!err && referral) {
                    // Add to refcodes in session.
                    if (req.session.refcodes && Array.isArray(req.session.refcodes)) {
                        // Push to array.
                        req.session.refcodes.push(refCode);
                    } else {
                        // Create array.
                        req.session.refcodes = [refCode];
                    }
                    console.log('---- REFCODES -----');
                    console.log(req.session.refcodes);
                    res.redirect(referral.destinationPath);
                    res.end();
                } else {
                    res.redirect('/');
                    res.end();
                }
            });
        } else if (req.path !== '/favicon.ico') {
            // This is an impression.
            // Do not count favicon.ico requests.
            // Record the metadata of the impression.
            
            console.log('==================== IMPRESSION ' + req.path +  ' ====================');
            
            var refCode = req.query.r;
            
            req.models.Impression.create([impression], function (err, items) {
                if (err) {
                    console.log(err);
                }
                                
                var createdImpression = items[0];
                
                // Sets user of impression, if user is logged in.
                setUserOfInstance(createdImpression, user, function() {

                    // Sets referral of impression, if there is a ref code (if user was referred).
                    setReferralOfImpression(createdImpression, refCode, function() {
                        
                       createdImpression.save(function (err) {
                          if (err) {
                              console.log(err);
                          }

                         next();
                       });
                    });
                });
            });
                        
        }

    }
    
    
    // Start everything up once the models have synced.
    emitter.on('model-synced', function() {
        startUp();
    });
    
    // Start everything up.
    function startUp() {
        
        app.use(express.cookieParser());
        app.use(express.bodyParser({
            uploadDir: __dirname + '/static/images/submissions-pre'
        }));
                
        app.use(express.session({
            secret: 'd9WvgPUdReT8D3dH50FUXuwkpMOcAxA1Nll8sLG9j1s',
            store: new ORMSessionStore(syncedModels)

        }, {maxAge: new Date(Date.now() + 3600000)}));
        app.use(passport.initialize());
        app.use(passport.session());

        app.use(roles.user.middleware());
        app.use(flash());
        app.use(analytics);
        
        app.use(app.router);


    //    app.listen();
    //
    //    if (!suppressLogs) {
    //        console.logger.info('Server started on ' + enums.options.hostname + ':' + enums.options.port);
    //    }
    //
    //    // Configure the routes.
        router(app, controllers);
    
    
        // New referral code being registered by a click on a sharing button.
        // Once referral code has been registered (PUT), it cannot be PUT again.
        app.post('/r/:refCode', function(req, res) {
            console.log('register refcode route')
        
            var refCode = req.params.refCode;
        
            if (referralPathFormat.test(req.path)) {
                // Valid referral path.
        
                // See if the referral under the refcode is already persistently stored.
                req.models.Referral.exists({
                    refCode: refCode
                }, function(err, exists) {
                    if (!exists) {
                        // No referral stored yet -- good!
                
                        var referral = {
                            refCode: refCode,
                            destinationPath: req.body.destinationPath,
                            medium: req.body.medium,
                            date: new Date(Date.now())
                        };
                
                        req.models.Referral.create([referral], function (err, items) {
                            if (err) {
                                console.log(err);
                            }
                        
                            console.log('created items');
                            console.log(items);
                        
                            var createdReferral = items[0];
                        
                            console.log('createdReferral (1)');
                            console.log(createdReferral);
                        
                            setUserOfInstance(createdReferral, req.user, function() {
                            
                                console.log('createdReferral (2)');
                                console.log(createdReferral)
                        
                                createdReferral.save(function (err) {
                                   if (err) {
                                       console.log(err);
                                   }
                           
                                   console.log('createdReferral (3)');
                                   console.log(createdReferral);
                           
                                   res.status(201);
                                   res.end();
                           
                                });
                        
                            });
                    
                        });
                
                    } else {
                        // Referral code already exists
                        res.status(204);
                        res.end();
                    }
                });
        
            } else {
                // Not valid referral path.
                res.status(200);
                res.end();
            }
        
        });
    

    
        http.createServer(app).listen(app.get('port'), function(){
            console.log('Express server listening on port ' + app.get('port'));
        });
        
    }


    //process.on('SIGINT', function () {
    //    console.logger.info('Server stopped.');
    //    process.exit(1);
    //});
};
