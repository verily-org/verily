var generic = require('./generic');
var enums = require('../enums');
var swig = require('swig');
var async = require('async');
var mode = require('../mode');
var s3 = require('../s3');


var submitToS3 = function(req, res) {
    var email = req.body.email;
    if (mode.isHeroku()) {
        if (email && email.length !== 0) {

            s3.get(s3.S3_SUBSCRIBERS_BUCKET_KEY, function(err, data) {
                if (err) {
                    console.log(err);
                    req.flash('error', 'Couldn\'t subscribe you right now.');
                    res.redirect('/');
                    res.end();
                } else {
                    // No error.
                    
                    // Get the string (UTF-8) encoding of the data.
                    var buffer = data.Body;
                    var string = buffer.toString('utf8');
                    var json = JSON.parse(string);
                    
                    // Add the email to the subscribers array within the JSON object.
                    if (json.hasOwnProperty('subscribers')) {
                        var subscriber = {
                            email: email,
                            date: new Date(Date.now()).getTime()
                        };
                        
                        json.subscribers.push(subscriber);
                        string = JSON.stringify(json);
                        
                        s3.put(s3.S3_SUBSCRIBERS_BUCKET_KEY, string, null, function(err, data) {
                            if (err) {
                                console.log('err in s3 put');
                                console.log(err);
                                req.flash('error', 'Couldn\'t subscribe you right now.');
                                res.redirect('/');
                                res.end();
                            } else {
                                req.flash('info', 'Thanks for subscribing.');
                                res.redirect('/');
                                res.end();
                            }
                        });
                        
                    } else {
                        console.log('no subscribers property in subscribers json')
                        req.flash('error', 'Couldn\'t subscribe you right now.');
                        res.redirect('/');
                        res.end();
                    }
                }
            });
            
            

        } else {
            req.flash('error', 'Couldn\'t subscribe you as nothing entered for your email address.');
            res.redirect('/');
            res.end();
        }
    } else {
        console.log('not running on heroku so can\'t subscribe user');
        req.flash('error', 'Couldn\'t subscribe you right now.');
        res.redirect('/');
        res.end();
    }
};

var submitToMailchimp = function(req, res) {
    var email = req.body.email;
    if (mode.isHeroku()) {
        if (email && email.length !== 0) {
        
            var MailchimpAPI = require('mailchimp').MailChimpAPI;
            var apiKey = process.env.MAILCHIMP_API_KEY;
            var mailchimp = new MailchimpAPI(apiKey, {
                version: '2.0'
            });
        
            mailchimp.call('lists', 'subscribe', {
                id: '43ced0f8e5',
                email: {
                    email: email
                }
            }, function(err, data) {
                if (err) {
                    console.log('err in mailchimp lists/subscribe');
                    console.log(err);
                    req.flash('error', 'Couldn\'t subscribe you right now.');
                    res.redirect('/');
                    res.end();
                } else {
                    req.flash('info', 'Thanks for subscribing.');
                    res.redirect('/');
                    res.end();
                }
            });
        
        } else {
            req.flash('error', 'Couldn\'t subscribe you as nothing entered for your email address.');
            res.redirect('/');
            res.end();
        }
        
    } else {
        console.log('not running on heroku so can\'t subscribe user');
        req.flash('error', 'Couldn\'t subscribe you right now.');
        res.redirect('/');
        res.end();
    }
    
};


exports.new = function (req, res) {
    submitToMailchimp(req, res);        
    submitToS3(req, res);
};