var LocalStrategy = require('passport-local').Strategy,
FacebookStrategy = require('passport-facebook').Strategy,
TwitterStrategy = require('passport-twitter'),
async = require('async'),
generic = require('../controllers/generic'),
config = require('./auth'),
usersController = require('../controllers/users'),
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
        var lastRefcode = req.session.refcodes[req.session.refcodes.length - 1];
        req.models.Referral.find({refCode: lastRefcode}, function (err, refs) {
            if (err) {return cb(err, null);}
            if (refs[0]) {
                var ref = refs[0];
                ref.getUser(function (err, user) {
                    if (err) {return cb(err, null);}
                    user.signupPoints += assignedPoints.referredSignup;
                    user.save(function (err) {
                        if (err) return cb(err, null);

                        cb(null, signupPoints);
                    });
                });
            }
        });
    } else {
        cb(null, signupPoints);
    }
};

var passportLogin = function(req, user, done) {
    req.logIn(user, function (err) {
        if (err) {
            return done(err);
        };
        return done(null, user);
    });
};

// Record the transfer in the UserHistory model.
var recordProvisionalUserTransfer = function(req, provisionalUser, user, callback) {
    var now = new Date(Date.now());
    
    req.models.UserHistory.create([{
        transferDate: now
    }], function (err, userHistory) {
        if (err) {
            console.log(err);
        }
        userHistory = userHistory[0];
        
        userHistory.setFromUser(provisionalUser, function(err) {
            if (err) {
                console.log(err);
            }
            
            userHistory.setToUser(user, function(err) {
                if (err) {
                    console.log(err);
                }
                
                callback(err);
                
            });
            
        });
    });  
};

var genericTransfer = function(targetObjectSet, provisionalUser, user, callback) {
    console.log('provisionalUser:')
    console.log(provisionalUser);
    console.log('targetObjectSet contents');
    console.log(provisionalUser[targetObjectSet]);
    if (provisionalUser.hasOwnProperty(targetObjectSet)) {    
        async.each(provisionalUser[targetObjectSet], function(targetObject, cb) {
            // Set user of each targetObject from the provisional user to user.
            targetObject.setUser(user, function(err) {
                if (err) {
                    console.log(err);
                }
                targetObject.save(function(err) {
                    if (err) {
                        console.log(err);
                    }
                    cb(err);
                });
            });
        
        }, function(err) {
            if (err) {
                console.log(err);
            }
            callback(err);
        });
    } else {
        // This targetObjectSet doesn't exist within provisionalUser,
        // but we can tolerate.
        callback();
    }
};

var transferRatings = function(req, provisionalUser, user, callback) {
    genericTransfer('ratings', provisionalUser, user, callback);
};

var transferComments = function(req, provisionalUser, user, callback) {
    genericTransfer('comments', provisionalUser, user, callback);
};

var transferPosts = function(req, provisionalUser, user, callback) {
    genericTransfer('posts', provisionalUser, user, callback);
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
        transferFromProvisional = req.body.transferFromProvisional,
        password = req.body.password;
        console.log('--------- local-login begin');
        if (!mail || !password || mail.length === 0 || password.length === 0) {
            return done(null, false, req.flash('error', 'Enter your login details'));
        } else {
            req.models.Local.find({ email :  mail }, 1, function(err, items) {
                // if there are any errors, return the error before anything else
                if (err){
                    console.log('--------- error here', err);
                    return done(null, false, req.flash('error', 'Invalid login details.'));
                }
                var local = items[0];
                // if no user is found, return the message
                if (local === undefined){
                    console.log('--------- error here=local');
                    return done(null, false, req.flash('error', 'Invalid login details.')); // req.flash is the way to set flashdata using connect-flash
                }

                // if the user is found but the password is wrong
                if (!local.validPassword(password)){
                    console.log('--------- error here on password', err);
                    return done(null, false, req.flash('error', 'Invalid login details.')); // create the error and save it to session as flashdata
                }
                     local.getUsers(function (err, users) {
                    if (err) {return done(err); }
                    var user = users[0];
                    // If the user is banned, return error with message
                    if(!user.active){
                        return done(null, false, req.flash('error', 'Invalid login details.'))
                    }
                    console.log('---------not banned no');
                    if (typeof transferFromProvisional !== 'undefined' && transferFromProvisional && transferFromProvisional == 'true') {
                        // Transfer content from provisional user to the user being logged in now.
                        var provisionalUser = req.user;
                        
                        // Add to logging-in user's points.
                        user.votingPoints = user.votingPoints + provisionalUser.votingPoints;
                        user.postPoints = user.postPoints + provisionalUser.postPoints;
                        
                        // Let's transfer!
                        // (Don't transfer impressions and referrals!)
                        
                        // Transfer Ratings.
                        transferRatings(req, provisionalUser, user, function(err) {

                            // Transfer Comments.
                            transferComments(req, provisionalUser, user, function(err) {
                                
                                // Transfer Posts.
                                transferPosts(req, provisionalUser, user, function(err) {
                                    
                                    // Record the transfer in the UserHistory model.
                                    recordProvisionalUserTransfer(req, provisionalUser, user, function(err) {
                                        
                                        // Save the user instance to the database.
                                        user.save(function (err) {
                                            
                                            // Now log the user in.
                                            passportLogin(req, user, done);
                                        });
                                    });
                                });
                            });
                        });
                        
                    } else {
                        // Don't transfer content.
                        // Log the user in.
                        passportLogin(req, user, done);
                    }    
                });
            });
        }


    }));

    // As part of signup process.
    // Set local model instance and log the user in.
    var finishSignup = function(req, user, local, done) {
        user.setLocal(local, function (err) {
            if (err) {return done(null, false, req.flash('error', 'Error in setting user-local relation'));};
            req.logIn(user, function (err) {
                if (err) return done(err);
                sendVerificationMail(req, local);
                done(null, user);
            });   
        });
    }

passport.use('local-register', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {
        var mail = req.body.email,
        transferFromProvisional = req.body.transferFromProvisional,
        username = req.body.name,
        password = req.body.password,
        password2 = req.body.verifyPassword,
        role = 'simple';
        termsAgreement = req.body.termsAgreement;
        console.log(termsAgreement);
        var userType = 'chosen-username';

        if (!termsAgreement) {
            return done(null, false, req.flash('error', 'You have to agree with our Terms and conditions in order to signup'));
        }
        
        if (password !== password2) {
            return done(null, false, req.flash('error', 'Passwords do not match.'));
        }

        if (!validatePassword(password)) {
            return done(null, false, req.flash('error', 'Password must contain at least one letter, ' + 
                                                            'at least one number, '+
                                                            'no special characters '+
                                                            'and be longer than six characters.'));
        }

        if (!validateEmail(mail)) {
            return done(null, false, req.flash('error', 'Email not valid!'));
        }

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to register already exists
        req.models.Local.exists({ email :  mail }, function (err, flag1) {
            // if there are any errors, return the error
            if (err)
                return done(err);

            // check to see if theres already a user with that email
            if (flag1) {
                return done(null, false, req.flash('error', 'That email is already taken.'));
            } else {
                req.models.User.exists({name: username}, function (err, flag2) {
                    if (err) 
                        return done(err);
                    //if there is a user with that username 
                    if (flag2) {
                        return done(null, false, req.flash('error', 'That username is not available. Choose a different one.'));    
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
                                
                                if (typeof transferFromProvisional !== 'undefined' && transferFromProvisional && transferFromProvisional == 'true') {
                                    // Use existing user instance and amend.
                                    var user = req.user;
                                    user.name = username;
                                    user.type = userType;
                                    user.role = role;
                                    
                                    // TODO: check this.
                                    user.signupPoints = signupPoints;

                                    // Save the user instance to the database.
                                    user.save(function (err) {
                                        finishSignup(req, user, local, done);
                                    });
                                    
                                } else {
                                    // Create new user instance.
                                    req.models.User.create([{
                                        name: username,
                                        type: userType,
                                        role: role,
                                        signupPoints: signupPoints
                                    }], function (err, u_created){
                                        if (err){return done(null, false, req.flash('error', 'Error in creating user')); }
                                        var user = u_created[0];
                                        finishSignup(req, user, local, done);   
                                    });
                                }
                            });
                        });
                    }
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
                    var email = 'nomail';
                    if (profile.emails) {
                        email = profile.emails[0].value;
                    }
                    
                    getReferredUser(req, function (err, signupPoints) {
                        if (err) return done(err);
                        req.models.Facebook.create([{
                            facebookId: profile.id,
                            token: token,
                            email: email
                        }], function (err, f_created) {
                            if (err) {return done(null, false, req.flash('error', err));  }
                            var facebook = f_created[0];
                            req.models.User.create([{
                                role: 'simple',
                                type: 'chosen-username',
                                signupPoints: signupPoints
                            }], function (err, u_created) {
                                if (err) {return done(null, false, req.flash('error', err));  }
                                var user = u_created[0];
                                user.setFacebook(facebook, function (err) {
                                    if (err) {return done(null, false, req.flash('error', err));  }
                                    return done(null, user);
                                });
                            });
                        }); 
                    });     
                }
            });
        });
    }));

    // TWITTER 
    passport.use(new TwitterStrategy({
        consumerKey     : config.twitterAuth.consumerKey,
        consumerSecret  : config.twitterAuth.consumerSecret,
        callbackURL     : config.twitterAuth.callbackURL,
        passReqToCallback: true
    },
    function(req, token, tokenSecret, profile, done) {
        // make the code asynchronous
        // it won't fire until we have all our data back from Twitter
        process.nextTick(function() {
            req.models.Twitter.find({twitterId: profile.id}, function(err, ts) {
                if (err)
                    return done(err);
                var twitter = ts[0];
                // if the user is found then log them in
                if (twitter) {
                    twitter.getUsers(function (err, users) {
                        if (err) {return done(null, false, req.flash('error', err));  }
                        return done(null, users[0]);// user found, return that user
                    });
                } else {    
                    getReferredUser(req, function (err, signupPoints) {
                        if (err) return done(err);
                        req.models.Twitter.create([{
                            twitterId: profile.id,
                            token: token
                        }], function (err, t_created) {
                            if (err) {return done(null, false, req.flash('error', err));  }
                            var twitter = t_created[0];
                            req.models.User.create([{
                                role: 'simple',
                                type: 'chosen-username',
                                signupPoints: signupPoints
                            }], function (err, u_created) {
                                if (err) {return done(null, false, req.flash('error', err));  }
                                var user = u_created[0];
                                user.setTwitter(twitter, function (err) {
                                    if (err) {return done(null, false, req.flash('error', err));  }
                                    return done(null, user);
                                });
                            });
                        }); 
                    });    
                }
            });
        });
    }));

}



