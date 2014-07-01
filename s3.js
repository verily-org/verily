// AWS wrapper.
// Currently requires environment variables to be set

var mode = require('./mode');
var aws = require('aws-sdk');
var s3Client = null;

var DEFAULT_ACL = 'public-read';
exports.BUCKET_ID = process.env.S3_BUCKET_ID;

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
exports.put = function(key, body, callback) {
    var params = {
        Bucket: exports.BUCKET_ID,
        Key: key,
        ACL: DEFAULT_ACL,
        Body: body
    }
    exports.client().putObject(params, function(err, data) {
        callback(err, data);
    });
};




