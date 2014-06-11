var nodemailer = require('nodemailer');

//Facebook authentication
exports.facebookAuth = {
		'clientID' 		: '519629081488284', // your App ID
		'clientSecret' 	: 'cbb4f75b9a1f0777ff15c1480abec46a', // your App Secret
		'callbackURL' 	: 'http://verily.herokuapp.com/auth/facebook/callback'
};

//SMTP setup
exports.mailer = nodemailer.createTransport('SMTP', {
    service: 'SendGrid',
    auth: {
        user: 'process.env.SENDGRID_USERNAME',
        pass: 'process.env.SENDGRID_PASSWORD'
    }
});