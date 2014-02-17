var enums = require('./enums'),
    winston = require('winston');
exports.init = function (config) {
    // adding log file and logging support.
    var logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)({
                handleExceptions: !enums.devMode
            }),
            new (winston.transports.File)({
                filename: config.serverlogfile,
                handleExceptions: !enums.devMode
            })
        ]
    }),
        requestlog;
    //had to give r an empty object.
    console.r = {};
    if (config.requestlogfile !== false) {
        requestlog = new (winston.Logger)({
            transports: [
                new (winston.transports.File)({
                    filename: config.requestlogfile
                })
            ]
        });
        // FIXME: Shouldn't be outputting messages into response
        // because response may be JSON output.
        console.r.info = function (req, statusCode, err) {
            //requestlog.info((err === null ? '' : ('Code:' + err.code + ' Message:' + err.message)) + ' StatusCode:' + statusCode + ' User IP:' + req.ip + ' Request URL:' + req.url+' POST Data:' + req.url);
            var error = (err === null ? null : {
                code: err.code,
                msg: err.message
            }),
                user_info = {
                    statusCode: statusCode,
                    IP: req.ip,
                    URL: req.url
                };
            //console.log( JSON.stringify(user_info).replace("'", r"\'"));
            requestlog.info(JSON.stringify(error) + JSON.stringify(user_info));
        };
        console.r.error = function (req, statusCode, err) {
            var error = (err === null ? null : {
                code: err.code,
                msg: err.message
            }),
                user_info = {
                    statusCode: statusCode,
                    IP: req.ip,
                    URL: req.url
                };
            requestlog.error(JSON.stringify(error) + JSON.stringify(user_info));
        };


    } else {
        console.r.info = console.r.error = function () {
            return null;
        };
    }

    //give logger function to a global variable, to make sure other files can access it easily.
    console.logger = logger;
    //example of logging.levels of log: info warn error
    //logger.log('info', 'Hello distributed log files!'); 
};