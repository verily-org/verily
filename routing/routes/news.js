exports.specific = '/news';
var specific = exports.specific;

exports.route = function (app, controllers, doc) {
    var route = require('../route')(app, controllers, doc, __filename);
    // View to create crisis
    route('get', '/news', 'news', 'Get news');
};
