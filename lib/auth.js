var nodemailer = require('nodemailer');

//Facebook authentication
exports.facebookAuth = {
		'clientID' 		: process.env.FACEBOOK_APP_ID || 'null',
		'clientSecret' 	: process.env.FACEBOOK_SECRET || 'null', 
		'callbackURL' 	: 'http://veri.ly/auth/facebook/callback'
};

exports.admin = {
	'username': process.env.ADMIN_USERNAME || 'admin',
	'password': process.env.ADMIN_PASSWORD || '1234'
};

//SMTP setup
exports.mailer = nodemailer.createTransport('SMTP', {
    service: 'SendGrid',
    auth: {
        user: process.env.SENDGRID_USERNAME,
        pass: process.env.SENDGRID_PASSWORD
    }
});