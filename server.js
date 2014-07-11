var ONE_DAY_MSECS = 86400000;

module.exports = function (suppressLogs, dbTestUrl) {
    var //fs = require('fs'),
        connect = require('connect'),
        express = require('express'),
        session = require('express-session'),
        cleaner = require('./cleaner')(),
        canon = require('./canon')(),
        orm = require('orm'),
        app = express(),
        emitter = require('./event-emitter')(),
        swig = require('swig'),
        passport = require('passport'),
        flash = require('connect-flash'),
        http = require('http'),
        async = require('async'),
        roles = require('./lib/roles'),
        swigHelpers = require('./helpers/swig'),
        enums = require('./enums'),
        router = require('./routing/router'),
        authConfig = require('./lib/auth'),
        log = require('./log'),
        ORMSessionStore = require('./orm-session-store')(express),
        mode = require('./mode'),
        common = require('./static/js/common'),
        controllers = {},
        heroku,
        syncedModels,
        secureCookies,
        global_db,
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
    controllers.subscribers = require('./controllers/subscribers');
    
    if (mode.isProduction()) {
        // Enable reverse proxy support
        app.enable('trust proxy');
        secureCookies = true;
    }


    app.use(connect.urlencoded());
    app.use(connect.json());

//    var csrf = express.csrf();
//    var admin_re = new RegExp("^/admin");
//    var conditionalCSRF = function (req, res, next) {
//        //compute needCSRF here as appropriate based on req.path or whatever
//        var needCSRF = (admin_re.test(req.path) === false);
//        if (needCSRF) {
//            csrf(req, res, next);
//        } else {
//            next();
//        }
//    };
    
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

    heroku = mode.isHeroku();

    if(dbTestUrl){
        db_url = dbTestUrl;
    }
    else if (heroku){
        // db_url = process.env.HEROKU_POSTGRESQL_CRIMSON_URL;
        db_url = process.env.HEROKU_POSTGRESQL_COBALT_URL
    } else {
    	db_url = "sqlite://app.db";
    }
    
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
                models.Twitter = db.models.twitter;
                models.Impression = db.models.impression;
                models.Referral = db.models.referral;
                models.Session = db.models.session;
                models.SocialEvent = db.models.socialEvent;
                models.UserHistory = db.models.userHistory;

                models.Local.sync(function () {console.log("Local synced")});
                models.QuestionComment.sync(function () {console.log("QuestionComment synced")});
                models.AnswerComment.sync(function () {console.log("AnswerComment synced")});
                models.Crisis.sync(function () {console.log("Crisis synced")});
                models.Post.sync(function () {console.log("Post synced")});
                models.User.sync(function () {console.log("User synced")});
                models.Question.sync(function () {console.log("Question synced")});
                models.Answer.sync(function () {console.log("Answer synced")});
                models.Comment.sync(function () {console.log("Comment synced")});
                models.Rating.sync(function () {console.log("Rating synced")});
                models.Facebook.sync(function () {console.log("Facebook synced")});
                models.Twitter.sync(function () {console.log("Twitter synced")});
                models.Impression.sync(function () {console.log("Impression synced")});
                models.Referral.sync(function () {console.log("Referral synced")});
                models.Session.sync(function () {console.log("Session synced")});
                models.SocialEvent.sync(function () {console.log("SocialEvent synced")});
                models.UserHistory.sync(function () {console.log("UserHistory synced")});

                // Post is the base class.
                // Questions, answers and comments are types of Post.

                db.sync(function () {
                    syncedModels = models;
                    emitter.emit('model-synced');
                    if (!suppressLogs) {
                        console.logger.info("Model synchronised");
                        
                    }
                                        
                });
                global_db = db;
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
                
        function setReferralOfImpression(createdImpression, refCodes, callback) {
            if (!refCodes) {
                callback();
            } else {
                // Transform refcodes to [{refcode: <refcode1>}, {refcode: <refcode2>}]
                // for node-orm format for disjunctions (or clause).
                var formattedRefCodes = refCodes.map(function (refCode) {
                    return {
                        refCode: refCode
                    };
                });
                
                console.log('formattedRefCodes');
                console.log(formattedRefCodes);
                
                req.models.Referral.find({
                    or: formattedRefCodes
                }, function(err, referrals) {
                    if (err) {
                        console.log(err);
                        callback();
                    } else if (referrals && referrals.length !== 0) {
                        // There are referrals.
                        console.log('in setReferralOfImpression');
                        console.log('refcodes produce referrals:')
                        console.log(referrals);
                        
                        createdImpression.addReferrals(referrals, function(err) {
                            if (err) {
                                console.log(err);
                            }

                            console.log('added referrals to impression. Impression:');
                            console.log(createdImpression);


                            callback();
                        });
                        
                        // async.each(referrals, function(referral, cb) {
                        //     createdImpression.addReferrals(referral, function (err) {
                        //        if (err) {
                        //            console.log(err);
                        //        }
                        //        cb();
                        //
                        //     });
                        // }, function(err) {
                        //     // All referrals added.
                        //     if (err) {
                        //         console.log(err);
                        //     }
                        //     callback();
                        // });
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
            console.log('---- REFCODES -----');
            console.log(req.session.refcodes);
            
            req.models.Impression.create([impression], function (err, items) {
                if (err) {
                    console.log(err);
                }
                                
                var createdImpression = items[0];
                
                // Sets user of impression, if user is logged in.
                setUserOfInstance(createdImpression, user, function() {

                    // Sets referrals of impression, 
                    // if there is at least one ref code in session (user was referred).
                    setReferralOfImpression(createdImpression, req.session.refcodes, function() {
                        
                       createdImpression.save(function (err) {
                          if (err) {
                              console.log(err);
                          }

                         next();
                       });
                    });
                });
            });
                        
        } else {
            next();
        }

    };
    
    // Express middleware for delivering robots.txt
    var robotstxt = function(req, res, next) {
        if (req.url === '/robots.txt') {
            res.type('text/plain');
            res.end('User-agent: *\nDisallow: /crisis/\nDisallow: /images/');
        } else {
            next();
        }
    };

    //Middleware for saving the current path in order to use it on redirecting the user 
    //after logging in or signing up 
    var saveRedirectUrl = function (req, res, next) {
        
        if (req.path.indexOf('/crisis') !== -1) {
            req.session.redirectUrl = req.path;
        }
        next();
    };
        

    
    // Start everything up.
    var startUp = function() {
        
        createAdmin(syncedModels.User, syncedModels.Local);
        
        app.use(express.cookieParser());
        app.use(express.bodyParser({
            uploadDir: __dirname + '/static/images/submissions-pre'
        }));
        
        // Redirect www URLs to the canonical non-www (apex) URLs.
        app.use(canon);
        
        app.use(robotstxt);
        
        // Call the cleaner now!
        app.use(cleaner);

        // 10 years in millseconds.
        var cookieExpireAfter = 10 * 365 * ONE_DAY_MSECS;
        
        var sess = {
            secret: 'd9WvgPUdReT8D3dH50FUXuwkpMOcAxA1Nll8sLG9j1s',
            store: new ORMSessionStore(syncedModels),
            cookie: {
                httpOnly: true,
                maxAge: cookieExpireAfter
            }
        };
        
        if (secureCookies && secureCookies === true) {
            // Serve secure cookies
            sess.cookie.secure = true;
        }
                
        app.use(session(sess));
        
        app.use(passport.initialize());
        app.use(passport.session());

        app.use(roles.user.middleware());
        app.use(flash());
        app.use(analytics);
        app.use(saveRedirectUrl);
        
        app.use(express.csrf());
        
		// middleware for common locals with request-specific values
        app.use(function (req, res, next) {
        	//console.log('csrf middleware');
        	//res.locals({
        	//	csrf_token: req.csrfToken()
        	//});
        	res.locals.csrf_token = req.csrfToken();
        	//res.locals.csrf_token = 'test';
        	next();
        });
        
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
                                                
                            var createdReferral = items[0];
                        
                            setUserOfInstance(createdReferral, req.user, function() {
                                                    
                                createdReferral.save(function (err) {
                                   if (err) {
                                       console.log(err);
                                   }
                           
                                   console.log('created referral');
                           
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
        
        
        // The last thing is error handling.
        app.use(function(req, res, next) {
            if (common.challengePublished()) {
                res.status(404);
                res.render('error/404', {
                    page: {
                        title: 'Not found'
                    },
                    user: req.user
                });
            } else {
                res.redirect('/');
                res.end();
            }

        });
    
        app.use(function(err, req, res, next) {
            if (common.challengePublished()) {
                res.send(500);
                res.render('error/500', {
                    page: {
                        title: 'Server error'
                    },
                    user: req.user
                });
            } else {
                res.redirect('/');
                res.end();
            }

        });

    
        http.createServer(app).listen(app.get('port'), function(){
            console.log('Express server listening on port ' + app.get('port'));
        });
        
    }
    
    // Start everything up once the models have synced.
    emitter.on('model-synced', function() {
        startUp();
    });

    //process.on('SIGINT', function () {
    //    console.logger.info('Server stopped.');
    //    process.exit(1);
    //});

    var createAdmin = function (User, Local) {
        User.exists({name: authConfig.admin.username}, function (err, exists) {
            if (err) {throw err;}
            if (!exists) {

                User.create([{
                    name: authConfig.admin.username,
                    role: 'admin'
                }], function (err, u_created) {
                    if (err) {throw err;}
                    var admin = u_created[0];
                    Local.create([{
                        email: authConfig.admin.username
                    }], function (err, l_created) {
                        if (err) {throw err;}
                        var local = l_created[0];
                        local.password = local.generateHash(authConfig.admin.password);
                        local.save(function (err) {
                            if (err) {throw err;}
                            admin.setLocal(local, function (err) {
                                if (err) {throw err;}
                                console.log('Admin user has been created.');
                            });
                        });
                    });
                });
            } else {
                console.log('Admin user already exists.');
            }
        });
    }

};
