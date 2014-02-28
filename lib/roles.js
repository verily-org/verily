var ConnectRoles = require('connect-roles');

exports.user = new ConnectRoles({
		failureHandler: function (req, res, action) {
	    // optional function to customise code that runs when
	    // user fails authorization
	    var accept = req.headers.accept || '';
	    res.status(403);
	    if (~accept.indexOf('html')) {
	      res.render('question/accessDenied', {action: action, user: null});
	    } else {
	      res.send('Access Denied - You don\'t have permission to: ' + action);
	    }
	  }
	});

	//var User = exports.user;

	exports.user.use('create question', function (req){
		if (req.user.role === 'editor')
			return true;
	});
