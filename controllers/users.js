var generic = require('./generic'),
enums = require('../enums'),
swig = require('swig'),
async = require('async'),
passport = require('passport'),
role = require('../lib/roles').user,
nodemailer = require('nodemailer'),
crypto = require('crypto'),
config = require('../lib/auth'),
mode = require('../mode'),
utils = require('utilities'),
common = require('../static/js/common'),
assignedPoints = require('../points.json');
require('../lib/passport')(passport);

var smtpTransport = config.mailer;
var trueValue;
var falseValue;
if (mode.isHeroku()) {
    trueValue = true;
    falseValue = false;
} else {
    trueValue = 1;
    falseValue = 0;
}

var validatePassword = function (password) {
    var re = /^(?=.*[0-9]+.*)(?=.*[a-zA-Z]+.*)[0-9a-zA-Z]{6,}$/;
    return re.test(password);
};

exports.profile = function (req, res) {
    if (req.user) {
        res.status(200);
        var user = req.user;
        req.models.Rating.findByPost({user_id:user.id}, function(err, ratingsArr){

            if(err)throw err;
//            var datetime = new Date();
//            console.log('Posts gotten: ' + datetime.getMinutes() +":"+datetime.getSeconds());

            var upvotes = 0;
            var downvotes = 0;
            var postAnswers = 0;
            upvotes = ratingsArr.filter(function(rating){return rating.isUpvote() && rating.show && common.isUserContentShow(rating.user);}).length;
            downvotes = ratingsArr.filter(function(rating){return rating.isDownvote() && rating.show && common.isUserContentShow(rating.user);}).length;
            req.models.Answer.findByPost({user_id:user.id}, function(err, answersArr){
                if(err)throw err;
                postAnswers = answersArr.length;
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
                        downvotes: downvotes,
                        error: req.flash('error'),
                        info: req.flash('info')
                    })
                });
            });

        });
    } else {
        // Not logged in.
        res.redirect('/login/');
    }
};

//Posts a new user
exports.register = function (req, res) {
    passport.authenticate('local-register', function (err, user, info) {
        if (err || !user) {
            res.redirect('/register');
        } else {
            req.logIn(user, function (err) {
                if (err) {
                    generic.genericErrorHandler(req, res, err);
                } else {
                    if (req.session.redirectUrl) {
                        res.redirect(req.session.redirectUrl);   
                    } else {
                        res.redirect('/');    
                    }
                }
            });
        }
    })(req, res);
};

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
    if (!req.user || req.user.type === 'provisional') {
        // Not logged in or using provisional user account.
        res.status(200);
        res.render('user/register', {
            page: {
                title: 'Signup'
            },
            error: req.flash('error'),
            info: req.flash('info')
        });
    } else {
        // Logged in, redirect to crisis.
        res.redirect('/crisis');
    }  
};

exports.loginView = function (req, res) {
    if (!req.user || req.user.type === 'provisional') {
        // No user currently logged in, or a provisional user is logged in.
        res.status(200);
        res.render('user/login', {
            page: {
                title: 'Login',
            },
            error: req.flash('error'),
            info: req.flash('info')
        });
        
    } else if (req.query.via === '/logout') {
        // logout-login cycle.
        // log them out (/logout), then take them to login view (/login)
        res.redirect('/logout?next=/login');
    }

};

// Helper to create a provisional user.
exports.newProvisionalUser = function(req, callback) {
    generic.generateUsernameDigits(function(digits) {
        var username = 'user-' + digits;
        var type = 'provisional';
        var role = 'simple';
        
        // TODO: Signup points might want to be set to something non-zero here
        // like in signup handler.
        var signupPoints = 0;
    
        // Create a new instance of User.
        req.models.User.create([{
            name: username,
            type: type,
            role: role,
            signupPoints: signupPoints
        }], function (err, users) {
            if (err) {
                console.log('error in creating provisional user:')
                console.log(err);
                callback(err);
            } else {
                var user = users[0];
                
                user.save(function(err) {
                    req.logIn(user, function (err) {
                        if (err) {
                            console.log('error in logging in provisional user:');
                            console.log(err);
                        }
                        callback(err, user);
                    });
                });

            }
        
        
        });
    });
    

};

exports.login = function (req, res) {
    passport.authenticate('local-login', function (err, user, info) {
        if (err || !user) {
            res.redirect('/login');
        } else {
            req.logIn(user, function (err) {
                if (err) {
                    generic.genericErrorHandler(req, res, err);
                } else {
                    if (req.session.redirectUrl) {
                        res.redirect(req.session.redirectUrl);   
                    } else {
                        res.redirect('/');    
                    }
                }
            });
        }
    })(req, res);
};

exports.clearSession = function(req, cb) {
    var destroySession = true;
    if (req.user.type === 'provisional') {
        destroySession = false;
    }

    // Destroy PassportJS login session.
    req.logout();
    //if user is not provisional destroy the session
    if (destroySession) {
        req.session.destroy(function (err) {
            if (err) {
                console.log(err);
            }
            cb(err);
        });
    } else {
        // Delete refcodes in session.
        // We are not getting a new session ID like in req.session.destroy
        // so that we can preserve redirectUrl within the session
        // and allow login from a provisional user to a chosen-username user.
        req.session.refcodes = null;
        delete req.session.refcodes;
        cb();  
    }
        
}

// If next is 'login', the session will be regnerated
exports.logout = function(req, callback) {
    exports.clearSession(req, function (err) {
        callback();    
    });
    
    // Now clear the whole session as PassportJS only clears login session, 
    // namespaced under session.user, and not the entire session state for the user.        
    // Destroy the session.
    // req.session.destroy(function (err) {
    //     if (err) {
    //         console.log(err);
    //     }
    //     callback(err);
    // });
};

exports.logoutView = function (req, res) {
    exports.logout(req, function(err) {
        if (req.query.next === '/login') {
            res.redirect('/login');
        } else {
            res.redirect('/logout-done');
        }
    });
};

exports.facebookRedirect = passport.authenticate('facebook', {
    scope: 'email'
});

exports.facebookAuthenticate = function (req, res) {
    passport.authenticate('facebook', function (err, user, info) {
        if (err || !user) {
            req.flash('error', 'There has been an error');
            res.redirect('/register');
        } else {
            if (!user.name) {
                req.session.user = user;
                req.flash('info', 'You have registered successfully with Facebook. Please choose your Verily username.');
                res.redirect('/chooseUsername');        
            } else {
                req.logIn(user, function (err) {
                    if (err) {
                        generic.genericErrorHandler(req, res, err);
                    } else {
                        if (req.session.redirectUrl) {
                            res.redirect(req.session.redirectUrl);   
                        } else {
                            res.redirect('/');    
                        }
                    }
                });
            }
        }
    })(req, res);
};

exports.twitterRedirect = passport.authenticate('twitter');

exports.twitterAuthenticate = function (req, res) {
    passport.authenticate('twitter', function (err, user, info) {
        console.log(req.session);
        if (err || !user) {
            req.flash('error', 'There has been an error');
            res.redirect('/register');
        } else {
            if (!user.name) {
                // New user on Verily.
                req.session.user = user;
                req.flash('info', 'You have registered successfully with Twitter. Please choose your Verily username.');
                res.redirect('/chooseUsername');        
            } else {
                // Existing user on Verily.
                req.logIn(user, function (err) {
                    if (err) {
                        generic.genericErrorHandler(req, res, err);
                    } else {
                        if (req.session.redirectUrl) {
                            res.redirect(req.session.redirectUrl);   
                        } else {
                            res.redirect('/');    
                        }       
                    }
                });
            }
        }
    })(req, res);
};

var canChooseUsername = role.can('choose a username');

var chooseUsernameViewf = function (req, res) {
    res.render('user/choose-username', {
        page: {
            title: 'Choose Username'
        },
        info: req.flash('info'),
        error: req.flash('error')
    }); 
};

exports.chooseUsernameView = [canChooseUsername, chooseUsernameViewf];

var chooseUsernamef = function (req, res) {
    if (!req.body.username) {
        req.flash('error', 'Please choose a username! You won\'t be logged in until you choose a username');
        res.redirect('/chooseUsername');
    }
    req.models.User.exists({name: req.body.username}, function (err, flag) {
        if (err) {
            generic.genericErrorHandler(req, res, err);
        } else {
            if (flag) {
                req.flash('error', 'That username is not available. Please choose a different one.');
                res.redirect('/chooseUsername');           
            } else {
                var userId = req.session.user.id;
                req.models.User.get(userId, function (err, user) {
                    if (err) {
                        generic.genericErrorHandler(req, res, err);  
                    } else {
                        user.name = req.body.username;
                        user.save(function (err) {
                            if (err) {
                                generic.genericErrorHandler(req, res, err);
                            } else {
                                req.logIn(user, function (err) {
                                    if (err) {
                                        generic.genericErrorHandler(req, res, err);
                                    } else {
                                        delete req.session.user;
                                        if (req.session.redirectUrl) {
                                            res.redirect(req.session.redirectUrl);   
                                        } else {
                                            res.redirect('/');    
                                        }
                                    }
                                });
                            }
                        }); 
                    }
                });
            }
        }
    });    
};

exports.chooseUsername = [canChooseUsername, chooseUsernamef];

var changeUsernameViewf = function (req, res) {
    res.render('user/change-username', {
        page: {
            title: 'Choose Username'
        },
        info: req.flash('info'),
        error: req.flash('error')
    });
};

exports.changeUsernameView = [role.can('change username'), changeUsernameViewf];

var changeUsernamef = function (req, res) {
    if (!req.body.username) {
        req.flash('error', 'Choose a username');
        res.redirect('/changeUsername');
    }
    req.models.User.exists({name: req.body.username}, function (err, flag) {
        if (err) {
            generic.genericErrorHandler(req, res, err);
        } else {
            if (flag) {
                req.flash('error', 'That username is not available. Please choose a different one.');
                res.redirect('/changeUsername');           
            } else {
                var user = req.user;
                user.name = req.body.username;
                user.save(function (err) {
                    if (err) {
                        req.flash('error', 'Your username could not be changed!');
                        res.redirect('/user');
                    }
                    req.flash('info', 'Your username has been changed to ' + user.name + '!');
                    res.redirect('/user');
                });
            }
        }
    });    
};

exports.changeUsername = [role.can('change username'), changeUsernamef];

var isAdmin = generic.isAdmin();

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

var assignRoles = function (req, res) {
    getRoles(req.models.User, function (err, basics, editors, admins) {
        if (err) {
            generic.genericErrorHandler(req, res, err); 
        } else {
            res.render('user/roles', {
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

exports.getRoles = [isAdmin, assignRoles];



var setRoles = function (req, res) {
    var basics = req.body.basics.split("|");
    var editors = req.body.editors.split("|");
    var admins = req.body.admins.split("|");
    var model = req.models.User;


    if (basics.indexOf(config.admin.username) !== -1 || editors.indexOf(config.admin.username) !== -1) {
        res.render('user/roles', {
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
                            res.render('user/roles', {
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

var getBanUsers = function (req, res) {
    req.models.User.find({role: 'simple'}, function (err, users) {
        if (err) {
            generic.genericErrorHandler(req, res, err);
        } else {
            async.each(users, load_user_extra_fields, function(err){
                if(err)throw err;
                res.render('user/banUsers', {
                    page: {
                        title: 'User Ban'
                    },
                    info: req.flash('info'),
                    //user: req.user,
                    users: users
                });
            });
        }
    });
};
var load_user_extra_fields = function(user, callback){
    var content_count = user.posts.length + user.comments.length;
    user.postsCommentsCount = content_count;
    callback(null);
}
exports.getBanUsers = [isAdmin, getBanUsers];

var postBanUser = function (req, res) {
    console.log('posted')
    req.models.User.get(req.body.user_id, function (err, user) {
        if (err) {
            generic.genericErrorHandler(req, res, err);
        } else {
            if(req.body.active == "1"){
                user.active = trueValue;
            }
            else{
                user.active = falseValue;
            }
            user.save(function(err){
                if(err){
                    req.flash('error', 'Couldn\'t save to database.');
                }
                else{
                    req.flash('info', 'User status saved successfully.');
                }
                res.redirect('/banUser');
                res.end();
            });
        }
    });
};
exports.postBanUser = [isAdmin, postBanUser];

var getUserContentList = function (req, res) {
    var datetime = new Date();
    console.log('entered: ' + datetime.getMinutes() +":"+datetime.getSeconds());
    req.models.User.get(req.params.user_id, function (err, user) {
        if (err) {
            generic.genericErrorHandler(req, res, err);
        } else {
            req.models.Answer.findByPost({user_id: user.id},function(err, answers){
                if(err)generic.genericErrorHandler(req, res, err);
                req.models.Comment.find({user_id: user.id},function(err, comments){
                    if(err)generic.genericErrorHandler(req, res, err);
                    res.render('user/contentList', {
                        page: {
                            title: 'User Content List'
                        },
                        info: req.flash('info'),
                        //user: req.user,
                        contentUser: user,
                        evidences: answers,
                        comments: comments
                    });
                });
            });

        }
    });
};
function msToTime(duration) {
    var milliseconds = parseInt((duration%1000)/100)
        , seconds = parseInt((duration/1000)%60)
        , minutes = parseInt((duration/(1000*60))%60)
        , hours = parseInt((duration/(1000*60*60))%24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
}
exports.getUserContentList = [isAdmin, getUserContentList];

var postEditUserEvidenceShow = function (req, res) {
    req.models.User.get(req.body.user_id, function (err, user) {
        if (err) {
            generic.genericErrorHandler(req, res, err);
        } else {
            var bool_value = falseValue;
            if(req.body.show == "1"){
                bool_value = trueValue;
            }
            req.models.Answer.findByPost({user_id: user.id}).each(function(answer){
                answer.show = bool_value;
            }).save(function(err){
                        if(err)generic.genericErrorHandler(req, res, err);
                        req.models.Comment.find({user_id: user.id}).each(function(comment){
                            comment.show = bool_value;
                        }).save(function(err){
                                if(err)generic.genericErrorHandler(req, res, err);
                                req.models.Rating.find({user_id: user.id}).each(function(rating){
                                    rating.show = bool_value;
                                }).save(function(err){
                                    if(err)generic.genericErrorHandler(req, res, err);

                                    req.flash('info', 'User content updated successfully.');
                                    res.redirect('user/'+user.id+'/userContentList');
                                });
                        });
                });
        }
    });
};
exports.postEditUserEvidenceShow = [isAdmin, postEditUserEvidenceShow];

var postEditCommentShow = function (req, res) {
    req.models.Comment.get(req.body.comment_id, function (err, comment) {
        if (err) {
            generic.genericErrorHandler(req, res, err);
        } else {
            var bool_value = falseValue;
            if(req.body.show == "1"){
                bool_value = trueValue;
            }
            comment.show = bool_value;
            comment.save(function(err){
                if(err)generic.genericErrorHandler(req, res, err);
                req.flash('info', 'Comment updated successfully.');
                res.redirect('user/'+req.body.user_id+'/userContentList');
            });
        }
    });
};
exports.postEditCommentShow = [isAdmin, postEditCommentShow];

var postEditEvidenceShow = function (req, res) {
    req.models.Answer.get(req.body.evidence_id, function (err, answer) {
        if (err) {
            generic.genericErrorHandler(req, res, err);
        } else {
            var bool_value = falseValue;
            if(req.body.show == "1"){
                bool_value = trueValue;
            }
            answer.show = bool_value;
            answer.save(function(err){
                if(err)generic.genericErrorHandler(req, res, err);
                req.flash('info', 'Evidence updated successfully.');
                res.redirect('user/'+req.body.user_id+'/userContentList');
            });
        }
    });
};
exports.postEditEvidenceShow = [isAdmin, postEditEvidenceShow];

var changePassView = function (req, res) {
    if (req.user) {
        res.render('user/change-pass', {
            page: {
                title: 'Change Password'
            },
            error: req.flash('error'),
            info: req.flash('info')
        });    
    } else {
        res.redirect('/login');
    }
};

exports.passChangeView = [role.can('change password'), changePassView];

var changePass = function (req, res) {
    var user = req.user,
    oldPassword = req.body.old_password,
    newPassword = req.body.new_password,
    confirmPassword = req.body.confirm_password;
    var message = '';

    if (newPassword !== confirmPassword) {
        req.flash('error', 'The new passwords do not match!');
        res.redirect('/changePass');    
    } else {
        if (!validatePassword(newPassword)) {
            req.flash('error', 'Password must contain at least one letter, ' + 
                                                        'at least one number, '+
                                                        'no special characters '+
                                                        'and be longer than six characters.');
            res.redirect('/changePass'); 
        } else {
            user.getLocal(function (err, local) {
                if (err) {
                    generic.genericErrorHandler(req, res, err);
                }
                if (!local.validPassword(oldPassword)) {
                    req.flash('error', 'The password is wrong.');
                    res.redirect('/changePass');  
                } else {
                    local.password = local.generateHash(newPassword);
                    local.save(function (err) {
                        if (err) {
                            generic.genericErrorHandler(req, res, err);
                        } 
                        req.flash('info', 'Your password has been changed!');
                        res.redirect('/user');
                    });
                }
            });
        }   
    }       
};

exports.passChange = [role.can('change password'), changePass];

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
                generic.sendMailtoLocal(req, token, local, 'forgot', function (err, local) {
                    done(err, local, 'done');
                });
            }
            ], function(err, local) {
                if (err) {
                    req.flash('info', 'There has been an error' + err);
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
            } else {
                res.render('user/reset', {
                    page: {
                        title: 'Reset Password'
                    }, 
                    token: token,
                    error: req.flash('error')
                }); 
            }   
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
                generic.sendMailtoLocal(req, null, local, 'reset', function (err, local) {
                    done(err, local, 'done');
                });
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
                                res.redirect('/user');
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
            local.verified = trueValue;
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


var getAllAnswers = function (req, res) {
    req.models.Crisis.find({}, function (err, crises) {
        if (err) {
            generic.genericErrorHandler(req, res, err); 
        } else {
            if (crises) {
                async.each(crises, function (crisis, cb) {
                    crisis.getQuestions(function (err, questions) {
                        if (err) {
                            cb(err); 
                        } else {
                            if (questions) {
                                async.each(questions, function (question, cb2) {
                                    question.getAnswers(function (err, answers) {
                                       if (!err) {
                                               // Answers present.
                                               async.each(answers, generic.load_answers_extra_fields, function (err) {
                                                   if (err) {
                                                       cb2(err);
                                                   } else {
                                                       question.answers = answers;
                                                       cb2(null);
                                                   }
                                               });
                                               
                                       } else {
                                           cb2(err);
                                       }
                                    });
                                }, function (err) {
                                    if (err) {
                                        cb(err);
                                    } else {
                                        crisis.questions = questions;
                                        cb(null);
                                    }
                                });
                            }
                        }
                    });
                }, function (err) {
                    if (err) {
                        generic.genericErrorHandler(req, res, err);   
                    } else {
                        res.render('user/adminAnswers', {
                            page: {
                                title: 'Answers'
                            },
                            crises: crises,
                            error: req.flash('error'),
                            info: req.flash('info')
                        });
                    }
                });
            }
        }
    });
};

exports.getAdminAnswers = [isAdmin, getAllAnswers];


var postAllAnswers = function (req, res) {
    var shown = req.body.shownAnswers.split("|").map(function(i){
        return parseInt(i, 10);
    });
    var hidden = req.body.hiddenAnswers;
    if (hidden || shown) {

        async.waterfall([
            function (done) {
                generic.showHideItem(req.models.Answer, shown, trueValue, function (err) {
                    done(err);
                });   
            },
            function (done) {
                generic.showHideItem(req.models.Answer, hidden, falseValue, function (err) {
                    done(err, 'done');
                });                  
            }], 
            function (err) {
                if (err) {
                    req.flash('error', 'An error occurred: ' + err);
                    res.redirect('/adminAnswers');  
                } else {
                    req.flash('info', 'Your changes have been made');
                    res.redirect('/adminAnswers');
                }
            }
        );

    } else {
        res.redirect('/adminAnswers');
    }
};

exports.postAdminAnswers = [isAdmin, postAllAnswers];


var getAllQuestions = function (req, res) {
    req.models.Question.find({}, function (err, questions) {
        if (err) {
            generic.genericErrorHandler(req, res, err);
        }
        async.each(questions, generic.load_question_extra_fields, function (err) {
            if (err) {
                generic.genericErrorHandler(req, res, err);  
            } else {
                questions.forEach(function(question) {
                    var relativeCreatedDate = utils.date.relativeTime(question.post.date, {abbreviated: true});
                    question.relativeCreatedDate = relativeCreatedDate;
                });
                res.render('user/hideQuestions', {
                    page: {
                        title: 'Questions'
                    },
                    questions: questions,
                    error: req.flash('error'),
                    info: req.flash('info')
                });
            }
        });
    });
};

exports.getAdminQuestions = [isAdmin, getAllQuestions];

exports.handleQuestions = function (req, res) {
    console.log('here');
    var shown = req.body.shownQuestions.split("|").map(function(i){
        return parseInt(i, 10);
    });
    var hidden = req.body.hiddenQuestions;
    if (hidden || shown) {

        async.waterfall([
            function (done) {
                generic.showHideItem(req.models.Question, shown, trueValue, function (err) {
                    done(err);
                });   
            },
            function (done) {
                generic.showHideItem(req.models.Question, hidden, falseValue, function (err) {
                    done(err, 'done');
                });                  
            }], 
            function (err) {
                if (err) {
                    req.flash('error', 'An error occurred: ' + err);
                    res.redirect('/hideQuestions');  
                } else {
                    req.flash('info', 'Your changes have been made');
                    res.redirect('/hideQuestions');
                }
            }
        );

    } else {
        res.redirect('/hideQuestions');
    }
};

//exports.handleQuestions = [isAdmin, postAllQuestions];