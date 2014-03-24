var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;

var configAuth = require('./auth');

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
        if (mail === undefined || password === undefined)
            return done(null, false, req.flash('loginMessage', 'Input details'));
        req.models.Local.find({ email :  mail }, 1, function(err, items) {
            var local = items[0];
            // if there are any errors, return the error before anything else
            if (err)
                return done(err);
            // if no user is found, return the message
            if (local === undefined)
                return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
            // if the user is found but the password is wrong
            if (!local.validPassword(password))
                return done(null, false, req.flash('loginMessage', 'Wrong password.')); // create the loginMessage and save it to session as flashdata
            local.getUsers(function (err, users) {
                if (err) {return done(err); }
                var user = users[0];
                req.logIn(user, function (err) {
                    if (err) return done(err);
                    return done(null, user);
                });
            });
        });
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
        role = req.body.role;
        
        if (password !== password2)
            return done(null, false, req.flash('registerMessage', 'Passwords do not match!'));

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        req.models.Local.exists({ email :  mail }, function(err, flag) {
            // if there are any errors, return the error
            if (err)
                return done(err);

            // check to see if theres already a user with that email
            if (flag) {
                return done(null, false, req.flash('registerMessage', 'That email is already taken.'));
            } else {

                // if there is no user with that email
                // create the user
                req.models.Local.create([{
                    email: mail,
                    role: role
                }], function (err, l_created){
                    if (err) {return done(null, false);  }
                    var local = l_created[0];
                    local.password = local.generateHash(password);
                    local.save(function (err) {
                        if (err) {return done(null, false); }
                        req.models.User.create([{
                            name: username,
                            role: role
                        }], function (err, u_created){
                            if (err){return done(null, false); }
                            var user = u_created[0];
                            user.setLocal(local, function (err){
                                if (err) throw err;
                                req.logIn(user, function (err) {
                                    if (err) return done(err);
                                    return done(null, user, req.flash('registerMessage', null));
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
        clientID        : configAuth.facebookAuth.clientID,
        clientSecret    : configAuth.facebookAuth.clientSecret,
        callbackURL     : configAuth.facebookAuth.callbackURL,
        passReqToCallback: true
    },

    // facebook will send back the token and profile
    function(req, token, refreshToken, profile, done) {

        // asynchronous
        process.nextTick(function() {

            // find the user in the database based on their facebook id
            req.models.Facebook.find({ id : profile.id }, function(err, fbs) {
                
                // if there is an error, stop everything and return that
                // ie an error connecting to the database
                if (err)
                    return done(err);
                var facebook = fbs[0];
                // if the user is found, then log them in
                if (facebook) {
                    facebook.getUsers(function (err, users) {
                        if (err) {return done(null, false);  }
                        return done(null, users[0]); // user found, return that user
                    }); 
                } else {
                    // if there is no user found with that facebook id, create them
                    req.models.Facebook.create([{
                        id: profile.id,
                        token: token,
                        name: profile.name.givenName + ' ' + profile.name.familyName,
                        email: profile.emails[0].value
                    }], function (err, f_created) {
                        if (err) {return done(null, false);  }
                        var facebook = f_created[0];
                        req.models.User.create([{
                            name: facebook.name,
                            role: 'simple'
                        }], function (err, u_created) {
                            if (err) {return done(null, false);  }
                            var user = u_created[0];
                            user.setFacebook(facebook, function (err) {
                                if (err) {return done(null, false);  }
                                return done(null, user);
                            });
                        });
                    });
                }

            });
        });

    }));




}