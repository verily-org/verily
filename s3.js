// AWS wrapper.
// Currently requires environment variables to be set

var mode = require('./mode');
var aws = require('aws-sdk');
var s3Client = null;

var DEFAULT_ACL = 'bucket-owner-full-control';
exports.ACL_PUBLIC_READ = 'public-read';
exports.BUCKET_ID = process.env.S3_BUCKET_ID;
exports.S3_SUBSCRIBERS_BUCKET_KEY = process.env.S3_SUBSCRIBERS_BUCKET_KEY + '/subscribers.json';

aws.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: 'eu-west-1',
    sslEnabled: true
});

// S3 client singleton.
exports.client = function() {
    if (!s3Client) {
        // Create S3 client.
        s3Client = new aws.S3({
            apiVersion: '2006-03-01'
        });
    }
    return s3Client;
};

// Higher-level API for uploading using AWS SDK putObject method.
exports.put = function(key, body, acl, callback) {
    if (!acl) {
        acl = DEFAULT_ACL;
    }
    var params = {
        Bucket: exports.BUCKET_ID,
        Key: key,
        ACL: acl,
        Body: body
    };
    exports.client().putObject(params, function(err, data) {
        callback(err, data);
    });
};

// Higher-level API for downloading using AWS SDK getObject method.
exports.get = function(key, callback) {
    var params = {
        Bucket: exports.BUCKET_ID,
        Key: key,
    };
    
    exports.client().getObject(params, function(err, data) {
        callback(err, data);
    });
};