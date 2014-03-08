module.exports = function (suppressLogs) {
    var fs = require('fs'),
        connect = require('connect'),
        express = require('express'),
        orm = require('orm'),
        app = express(),
        emitter = require('./event-emitter')(),
        swig = require('swig'),
        passport = require('passport'),
        flash = require('connect-flash'),

        roles = require('./lib/roles'),
        swigHelpers = require('./helpers/swig'),
        enums = require('./enums'),
        router = require('./routing/router'),
        log = require('./log'),
        controllers = {},
        db_url;

    //initial log functions.
    log.init(enums);

    controllers.questions = require('./controllers/questions');
    controllers.question_comments = require('./controllers/question_comments');
    controllers.answers = require('./controllers/answers');
    controllers.answer_comments = require('./controllers/answer_comments');
    controllers.users = require('./controllers/users');
    controllers.ratings = require('./controllers/ratings');

    // Following line replaced to avoid warnings –
    // see https://github.com/senchalabs/connect/wiki/Connect-3.0
    app.use(express.bodyParser());

    app.use(connect.urlencoded());
    app.use(connect.json());
    
    // To allow use of all HTTP methods in the browser through use of _method variable
    app.use(express.methodOverride());
    
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
    app.use(connect.limit('5kb'));

    // Overwrite demo.sh at the start of execution because it is appended to.
    if (enums.document) {
        fs.writeFile(enums.demo, '#!/bin/bash\n\n', function (err) {
            if (err) {
                throw err;
            }
        });
    }

    db_url = "sqlite://app.db";
    
    if (process.env.DATABASE_URL === undefined) {
    	db_url = "sqlite://app.db";
    } else {
    	//console.log('db:', process.env.DATABASE_URL);
    	db_url = "postgres://" + process.env.DATABASE_URL;
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

                models.Post = db.models.post;
                models.Question = db.models.question;
                models.Answer = db.models.answer;
                models.QuestionComment = db.models.question_comment;
                models.AnswerComment = db.models.answer_comment;
                models.Rating = db.models.rating;
                models.User = db.models.user;
                models.Local = db.models.local;
                models.Facebook = db.models.facebook;

                // Post is the base class.
                // Questions, answers and comments are types of Post.

                db.sync(function () {
                    emitter.emit('model-synced');
                    if (!suppressLogs) {
                        console.logger.info("Model synchronised");
                    }
                });
            });
            next();
        }
    }));

    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.session({ secret: 'cat' }, {maxAge: new Date(Date.now() + 3600000)}));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(roles.user.middleware());
    app.use(flash());
    app.use(app.router);

    app.listen(enums.options.port, enums.options.hostname);

    if (!suppressLogs) {
        console.logger.info('Server started on ' + enums.options.hostname + ':' + enums.options.port);
    }

    // Configure the routes.
    router(app, controllers);

    process.on('SIGINT', function () {
        console.logger.info('Server stopped.');
        process.exit(1);
    });
};