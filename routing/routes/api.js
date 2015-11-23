exports.specific = "/r1";
exports.route = function (app, controllers, doc) {
	var route = require('../route')(app, controllers, doc, __filename);
	route('get','/api/csrf', 'csrf', 'api');
	route('get','/api/isLoggedIn', 'isLoggedIn', 'api');
        route('get','/api/crises', 'allCrisises', 'api');
        route('get', '/api/analytics', 'analytics', 'api');
        route('get', '/api/tags', 'tags', 'api');
        route('get', '/api/newsStatistic', 'newsStatistic', 'api');
};
