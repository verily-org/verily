var LocalStrategy = require('passport-local').Strategy,
FacebookStrategy = require('passport-facebook').Strategy,
async = require('async'),
generic = require('../controllers/generic'),
config = require('./auth'),
assignedPoints = require('../points.json');

var smtpTransport = config.mailer;

var validateEmail = function (email) {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
};

var validatePassword = function (password) {
    var re = /^(?=.*[0-9]+.*)(?=.*[a-zA-Z]+.*)[0-9a-zA-Z]{6,}$/;
    return re.test(password);
};

var sendVerificationMail = function (req, local, cb) {
async.waterfall([
    function (done) {
        generic.generateToken(done);    
    },
    function(token, done) {
        local.verificationToken = token;
        local.save(function (err) {
            done(err, token);
        });
    },
    function(token, done) {
        generic.sendMailtoLocal(req, token, local, 'verify', function (err, local) {
            done(err, local, 'done');
        });
    }
    ], function(err) {
        if (err) {
            req.flash('error', err);
        }
    });
};


var getReferredUser = function (req, cb) {
    var signupPoints = assignedPoints.signup;
    if (req.session.refcodes) {
        signupPoints = assignedPoints.referredSignup;
        req.models.Referral.find({refCode: req.session.refcodes.pop()}, function (err, refs) {
            if (err) {return cb(err, null);}
            if (refs[0]) {
                var ref = refs[0];
                ref.getUser(function (err, user) {
                    if (err) {return cb(err, null);}
                    user.signupPoints += assignedPoints.referredSignup;
                    user.save(function (err) {
                        if (err) return cb(err, null);
                        delete req.session.refcodes;
                        cb(null, signupPoints);
                    });
                });
            }
        });
    } else {
        cb(null, signupPoints);
    }
};


module.exports = function (passport) {
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(req, id, done) {
        req.models.User.get(id, function(err, user) {
            if (err) {throw err;}
            done(err, user);
        });
    });

    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form
        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        var mail = req.body.email,
        password = req.body.password;
        if (!mail || !password || mail.length === 0 || password.length === 0) {
            return done(null, false, req.flash('error', 'Enter your login details'));
        } else {
            req.models.Local.find({ email :  mail }, 1, function(err, items) {
                // if there are any errors, return the error before anything else
                if (err){
                    return done(null, false, req.flash('error', 'Invalid login details.'));
                }
                var local = items[0];
                // if no user is found, return the message
                if (local === undefined){
                    return done(null, false, req.flash('error', 'Invalid login details.')); // req.flash is the way to set flashdata using connect-flash
                }

                // if the user is found but the password is wrong
                if (!local.validPassword(password))
                    return done(null, false, req.flash('error', 'Invalid login details.')); // create the error and save it to session as flashdata
                local.getUsers(function (err, users) {
                    if (err) {return done(err); }
                    var user = users[0];
                    req.logIn(user, function (err) {
                        if (err) return done(err);
                        return done(null, user);
                    });
                });
            });
        }


    }));


passport.use('local-register', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {
        var mail = req.body.email,
        username = req.body.name,
        password = req.body.password,
        password2 = req.body.verifyPassword,
        role = 'simple';
        if (password !== password2) {
            return done(null, false, req.flash('error', 'Passwords do not match.'));
        }

        if (!validatePassword(password)) {
            return done(null, false, req.flash('error', 'Password must contain at least one letter, ' + 
                                                            'at least one number, '+
                                                            'no special characters '+
                                                            'and be longer than six charaters.'));
        }

        if (!validateEmail(mail)) {
            return done(null, false, req.flash('error', 'Email not valid!'));
        }

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to register already exists
        req.models.Local.exists({ email :  mail }, function(err, flag1) {
            // if there are any errors, return the error
            if (err)
                return done(err);

            // check to see if theres already a user with that email
            if (flag1) {
                return done(null, false, req.flash('error', 'That email is already taken.'));
            } else {
                getReferredUser(req, function (err, signupPoints) {
                    if (err) return done(err);
                    // create the user
                    req.models.Local.create([{
                        email: mail
                    }], function (err, l_created){
                        if (err) {return done(null, false, req.flash('error', 'Error in creating local user.'));  }
                        var local = l_created[0];
                        local.password = local.generateHash(password);
                        req.models.User.create([{
                            name: username,
                            role: role,
                            signupPoints: signupPoints
                        }], function (err, u_created){
                            if (err){return done(null, false, req.flash('error', 'Error in creating user')); }
                            var user = u_created[0];
                            user.setLocal(local, function (err){
                                if (err) {return done(null, false, req.flash('error', 'Error in setting user-local relation'));};
                                req.logIn(user, function (err) {
                                    if (err) return done(err);
                                    sendVerificationMail(req, local);
                                    done(null, user);
                                });   
                            });
                        });
                    });
                });  
            }
        });    
    }));


//FACEBOOK

passport.use(new FacebookStrategy({

        // pull in our app id and secret from our auth.js file
        clientID        : config.facebookAuth.clientID,
        clientSecret    : config.facebookAuth.clientSecret,
        callbackURL     : config.facebookAuth.callbackURL,
        passReqToCallback: true
    },

    // facebook will send back the token and profile
    function(req, token, refreshToken, profile, done) {

        // asynchronous
        process.nextTick(function() {

            // find the user in the database based on their facebook id
            req.models.Facebook.find({facebookId: profile.id}, function(err, fbs) {
                // if there is an error, stop everything and return that
                // ie an error connecting to the database
                if (err){
                    console.log(err);
                    return done(err);
                }    
                var facebook = fbs[0];
                // if the user is found, then log them in
                if (facebook) {
                    facebook.getUsers(function (err, users) {
                        if (err) {return done(null, false, req.flash('error', err));  }
                        return done(null, users[0]); // user found, return that user
                    }); 
                } else {
                    // Check to see if there is a user with the same name
                    var flag = true;
                    var name = profile.name.givenName + ' ' + profile.name.familyName;
                    var count = 1;
                    
                    async.whilst(function () {return flag}, 
                        function (cb) {
                            req.models.User.find({name: name}, function (err, users) {
                                if (err) {return done(null, false, req.flash('error', err));  }
                                //if it does add a number at the end of the name and check again 
                                if (users.length > 0) {
                                    name = name + count;
                                    count++;
                                } else {
                                    flag = false;
                                }
                                cb();
                            });   
                        }, 
                        function (err) {
                            if (err) {return done(null, false, req.flash('error', err));  } 

                            var email = 'nomail';
                            if (profile.emails) {
                                email = profile.emails[0].value;
                            }
                            
                            req.models.Facebook.create([{
                                facebookId: profile.id,
                                token: token,
                                name: name,
                                email: email
                            }], function (err, f_created) {
                                if (err) {return done(null, false, req.flash('error', err));  }
                                var facebook = f_created[0];
                                req.models.User.create([{
                                    name: facebook.name,
                                    role: 'simple',
                                    signupPoints: assignedPoints.signup
                                }], function (err, u_created) {
                                    if (err) {return done(null, false, req.flash('error', err));  }
                                    var user = u_created[0];
                                    user.setFacebook(facebook, function (err) {
                                        if (err) {return done(null, false, req.flash('error', err));  }
                                        return done(null, user);
                                    });
                                });
                            });   
                        }
                    ); 
                }
            });
        });
    }));
}




