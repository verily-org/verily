var generic = require('./generic'),
enums = require('../enums'),
swig = require('swig'),
async = require('async'),
passport = require('passport'),
role = require('../lib/roles').user,
nodemailer = require('nodemailer'),
crypto = require('crypto'),
config = require('../lib/auth'),
assignedPoints = require('../points.json');
require('../lib/passport')(passport);

var smtpTransport = config.mailer;

var validatePassword = function (password) {
    var re = /^(?=.*[0-9]+.*)(?=.*[a-zA-Z]+.*)[0-9a-zA-Z]{6,}$/;
    return re.test(password);
};

exports.profile = function (req, res) {
    if (req.user) {
        res.status(200);
        var user = req.user;
        user.getPosts(function (err, posts) {
            if (err) {
                generic.genericErrorHandler(req, res, err);
            }
            var upvotes = 0;
            var downvotes = 0;
            var postAnswers = 0;
            for (var i = 0; i < posts.length; i++) {
                upvotes += posts[i].getUpvoteCount();
                downvotes += posts[i].getDownvoteCount();
                if (posts[i].answers.length > 0) {
                    postAnswers += 1;
                }    
            }
            user.postPoints = postAnswers * assignedPoints.postEvidence;
            user.votingPoints = upvotes * assignedPoints.voteUp;
            user.save(function (err) {
                if (err) {
                    generic.genericErrorHandler(req, res, err);       
                }
                res.render('user/profile', {
                    page: {
                        title: 'Profile'
                    },
                    user: user,
                    points: user.getTotalPoints(),
                    posts: postAnswers,
                    upvotes: upvotes,
                    downvotes: downvotes
                })    
            });
        });
        ;
    } else {
        // Not logged in.
        res.redirect('/login/');
    }
};

//Posts a new user
exports.register = passport.authenticate('local-register', {
    successRedirect : 'back', // redirect to the page they were on
    failureRedirect : '/register', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
});

exports.logoutDone = function (req, res) {
    if (!req.user) {
        // No user -- logged out.
        res.status(200);
        res.render('user/logout-done', {
            page: {
                title: 'Logged out'
            }
        });
    } else {
        // They visited this page manually but are still logged in, 
        // or logged in again from this page ('back' functionality)
        res.redirect('/');
    }
};

exports.registerView = function (req, res) {
    if (!req.user) {
        res.status(200);
        res.render('user/register', {
            page: {
                title: 'Signup'
            },
            error: req.flash('error'),
            info: req.flash('info')
        });
    } else {
        // Logged out or signed up from canonical signup form (rather than an inline form)
        res.redirect('/');
    }
    
};

exports.loginView = function (req, res) {
    if (!req.user) {
        res.status(200);
        res.render('user/login', {
            page: {
                title: 'Login',
            },
            error: req.flash('error'),
            info: req.flash('info')
        });
    } else {
        // If they are already logged in,
        // don't let them log in again!
        // This is also used when login to make the 'back' redirect behaviour work.
        res.redirect('/');
    }

};

exports.login = passport.authenticate('local-login', {
    successRedirect : 'back', // redirect to the page they were on
    failureRedirect : '/login', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
});

exports.logout = function (req, res) {
    req.logout();
    
    // Clear the session as PassportJS only clears login session, 
    // namespaced under session.user, and not the entire session state for the user.
    req.session.destroy(function (err) {
        if (err) {
            console.log(err);
        }
        res.redirect('/logout-done');
    });
};

exports.facebookRedirect = passport.authenticate('facebook', {
    scope: 'email'
});

exports.facebookAuthenticate = passport.authenticate('facebook', {
    successRedirect : 'back', // redirect to the secure profile section
    failureRedirect : '/login', // redirect back to the signup page if there is an error
});

var isAdmin = role.can('assign roles');

var getRoles = function (model, cb) {
    var basics = [];
    var editors = [];
    var admins = [];
    var role;

    model.find({}, 'name', function (err, users) {
        if (err) {
            cb(err, null, null, null);
        } else {
            for (var i = 0; i < users.length; i++) {
                role = users[i].role;
                switch (role) {
                    case 'simple':
                        basics.push(users[i].name);
                        break;
                    case 'editor':
                        editors.push(users[i].name);
                        break;
                    case 'admin':
                        admins.push(users[i].name);
                        break;
                    default:
                        break;
                }
            }
            cb(null, basics, editors, admins);
        }
    });   
};

var adminPage = function (req, res) {
    getRoles(req.models.User, function (err, basics, editors, admins) {
        if (err) {
            generic.genericErrorHandler(req, res, err); 
        } else {
            res.render('user/admin', {
                page: {
                    title: 'Administrator'
                },
                //user: req.user,
                basics: basics,
                editors: editors,
                admins: admins
            });   
        }
    });
};

exports.getAdminPage = [isAdmin, adminPage];



var setRoles = function (req, res) {
    var basics = req.body.basics.split("|");
    var editors = req.body.editors.split("|");
    var admins = req.body.admins.split("|");
    var model = req.models.User;


    if (basics.indexOf('Admin') !== -1 || editors.indexOf('Admin') !== -1) {
        res.render('user/admin', {
            page: {
                title: 'Administrator'
            },
            basics: basics,
            editors: editors,
            admins: admins,
            submitMessage: 'You cannot move the Admin user to another column!'
        });  
    } else {
        var setBasic = function (item, callback) {
            model.find({name: item}, function (err, result) {
                var user = result[0];
                if (user) {
                    if (user.role !== 'simple') {
                        user.role = 'simple';
                        user.save(function (err) {
                            if (err) {
                                generic.genericErrorHandler(req, res, err); 
                                callback(err);
                            }
                            callback();
                        });
                    } else {callback(); }
                } else {callback(); }
                
            });  
        };

        var setEditor = function (item, callback) {
            model.find({name: item}, function (err, result) {
                var user = result[0];
                if (user) {
                    if (user.role !== 'editor') {
                        user.role = 'editor';
                        user.save(function (err) {
                            if (err) {
                                generic.genericErrorHandler(req, res, err);
                                callback(err);
                            }
                            callback();
                        });
                    } else { callback(); }
                } else {callback(); }
                
            });  
        };

        var setAdmin = function (item, callback) {
            model.find({name: item}, function (err, result) {
                var user = result[0];
                if (user) {
                    if (user.role !== 'admin') {
                        user.role = 'admin';
                        user.save(function (err) {
                            if (err) {
                                generic.genericErrorHandler(req, res, err);
                                callback(err);
                            }
                            callback();
                        });
                    } else {
                        callback();
                    }
                } else {
                    callback();
                }
                
            });  
        };

        async.each(basics, setBasic, function (err) {
            if (err) {generic.genericErrorHandler(req, res, err); }
            async.each(editors, setEditor, function (err) {
                if (err) {generic.genericErrorHandler(req, res, err); }
                async.each(admins, setAdmin, function (err) {
                    if (err) {generic.genericErrorHandler(req, res, err); }
                    getRoles(req.models.User, function (err, basics, editors, admins) {
                        if (err) {
                            generic.genericErrorHandler(req, res, err); 
                        } else {
                            res.render('user/admin', {
                                page: {
                                    title: 'Administrator'
                                },
                                //user: req.user,
                                basics: basics,
                                editors: editors,
                                admins: admins,
                                submitMessage: 'Your changes have been submitted!'
                            });   
                        }
                    });
                });
            });
        });
    }
};

exports.changeRoles = [isAdmin, setRoles];

exports.passChangeView = function (req, res) {
    if (req.user) {
        res.render('user/change-pass', {
            page: {
                title: 'Change Password'
            }
        });    
    } else {
        res.redirect('/login');
    }
};

exports.passChange = function (req, res) {
    if (req.user) {
        var user = req.user,
        oldPassword = req.body.old_password,
        newPassword = req.body.new_password,
        confirmPassword = req.body.confirm_password;
        var message = '';

        if (newPassword !== confirmPassword) {
            res.render('user/change-pass', {
                page: {
                    title: 'Change Password'
                }, message: 'The new passwords do not match!'
            });    
        } else {
            user.getLocal(function (err, local) {
                if (err) {
                    generic.genericErrorHandler(req, res, err);
                }
                if (!local.validPassword(oldPassword)) {
                    res.render('user/change-pass', {
                        page: {
                            title: 'Change Password'
                        }, message: 'The password is wrong.'
                    });    
                } else {
                    local.password = local.generateHash(newPassword);
                    local.save(function (err) {
                        if (err) {
                            generic.genericErrorHandler(req, res, err);
                        } 
                        res.render('user/change-pass', {
                            page: {
                                title: 'Change Password'
                            }, messageCorrect: 'Your password has been changed!'
                        });
                    });
                }
            });    
        }       
    } else {
        res.redirect('/login');
    }
};

exports.forgotView = function (req, res) {
    if (!req.user) {    
        res.render('user/forgot', {
            page: {
                title: 'Forgotten Password'
            }, 
            error: req.flash('error'),
            info: req.flash('info')
        });
    } else {
        res.redirect('/changePass');
    }
};

exports.forgot = function (req, res) {
    if (!req.user) { 
        async.waterfall([
            function (done) {
                generic.generateToken(done)    
            },
            function(token, done) {
                req.models.Local.find({ email: req.body.email }, function(err, locals) {
                    var local = locals[0];
                    if (local === undefined) {
                        var error = 'No account with that email address exists.';
                        req.flash('error', error);
                        res.redirect('/forgot'); 
                        return;
                    }

                    local.resetPasswordToken = token;
                    local.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

                    local.save(function(err) {
                        done(err, token, local);
                    });
                });
            },
            function(token, local, done) {
                generic.sendMailtoLocal(req, token, local, 'forgot', done);
            }
            ], function(err, local) {
                if (err) {
                    req.flash('info', 'There has been an error');
                    res.redirect('/forgot');
                    return; 
                };
                var info = 'An e-mail has been sent to ' + local.email + ' with further instructions.';
                req.flash('info', info);
                res.redirect('/forgot'); 
        });
    } else {
        res.redirect('/changePass');
    }
};

exports.resetView = function (req, res) {
    if (!req.user) {
        var token = req.params.token;
        req.models.Local.find({ resetPasswordToken: token }, 1, function(err, locals) {
            var local = locals[0];
            if (local === undefined || local.resetPasswordExpires < Date.now()) {
                var error = 'Password reset token is invalid or has expired.';
                res.render('user/forgot', {
                    page: {
                        title: 'Forgotten Password'
                    }, error: error
                }); 
            }

            res.render('user/reset', {
                page: {
                    title: 'Reset Password'
                }, 
                token: token,
                error: req.flash('error')
            });
        });
    } else {
        res.redirect('/changePass');
    }
};

exports.reset = function (req, res) {
    if (!req.user) {
        var token = req.body.token;
        var password = req.body.password;
        var confirm = req.body.confirm;
        async.waterfall([
            function(done) {
                req.models.Local.find({ resetPasswordToken: token }, 1, function(err, locals) {
                    var local = locals[0];
                    if (local === undefined || local.resetPasswordExpires < Date.now()) {
                        var error = 'Password reset token is invalid or has expired.';
                        req.flash('error', error);
                        res.redirect('/reset/'+token);
                        return;
                    }

                    if (password !== confirm) {
                        var error = 'Passwords do not match.';
                        req.flash('error', error);
                        res.redirect('/reset/'+token);
                        return;   
                    }

                    if (!validatePassword(password)) {
                        var error = 'Password must contain at least one letter, at least one number, no special characters and be longer than six charaters.';
                        req.flash('error', error);
                        res.redirect('/reset/'+token);
                        return;   
                    }

                    local.password = local.generateHash(password);
                    local.resetPasswordToken = undefined;
                    local.resetPasswordExpires = undefined;
                    local.save(function(err) {
                        done(err, local);
                    });
                });
            },
            function(local, done) {
                generic.sendMailtoLocal(req, null, local, 'reset', done);
            }
        ], function(err, local) {
            if (err) {
                req.flash('error', 'Your password did not change.');
                res.redirect('/reset/'+token);
            } else {
                local.getUsers(function (err, users) {
                    if (err) {
                        req.flash('error', 'Your password did not change.');
                        res.redirect('/reset/'+token); 
                    } else {
                        var user = users[0];
                        req.logIn(user, function (err) {
                            if (err) {
                                req.flash('error', 'Your password did not change.');
                                res.redirect('/reset/'+token); 
                            } else {
                                req.flash('info', 'Your password has been changed!');
                                res.redirect('/');
                            }
                        });    
                    }
                    
                });
            }
        });
    } else {
        res.redirect('/changePass');
    }
};

exports.verifyAccount = function (req, res) {
    var token = req.params.token;
    req.models.Local.find({verificationToken: token}, function (err, locals) {
        if (err) {
            req.flash('info', 'Error in database');
            res.redirect('/');
        }
        if (!locals[0]) {
            req.flash('info', 'The token is invalid!');
            res.redirect('/');
        } else {
            var local = locals[0];
            local.verified = '1';
            local.verificationToken = undefined;
            local.save(function (err) {
                if (err) {
                    req.flash('info', 'Error in database');
                    res.redirect('/');
                    return;
                }
                req.flash('info', 'Your account has been verified!');
                res.redirect('/');
            });
        }
    });
};
