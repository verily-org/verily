var ConnectRoles = require('connect-roles');

exports.user = new ConnectRoles({
		failureHandler: function (req, res, action) {
	    // optional function to customise code that runs when
	    // user fails authorization
	    var accept = req.headers.accept || '';
	    res.status(403);
	    if (~accept.indexOf('html')) {
	    	if (req.user) {
	      		res.render('user/access-denied', {action: action, user: req.user.name});
	      	} else {
	      		res.render('user/access-denied', {action: action});
	      	}
	    } else {
	      	res.send('Access Denied - You don\'t have permission to: ' + action);
	    }
	  }
	});

	//var User = exports.user;

	exports.user.use('create a question', function (req){
		if (req.user && req.user.role === 'editor')
			return true;
	});

	exports.user.use('create an answer', function (req) {
		if (req.user)
			return true;
	});

	exports.user.use('create a crisis', function (req){
		if (req.user && req.user.role === 'editor')
			return true;
	});

