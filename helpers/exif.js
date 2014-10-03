var fs = require('fs');
var request = require('request');
var path = require('path');
var ExifImage = require('exif').ExifImage;

function convertHemisphere(hem) {
    var returner = 0;
    hem = hem.toLowerCase();
    if (hem === 's' || hem === 'w') {
        returner = -1;
    }
    return returner;
}

function toDecimal(deg, min, sec, hem) {
    var returner = deg + (min / 60) + (sec / 3600);
    
    if (convertHemisphere(hem) === -1) {
        returner = -returner;
    }
    
    return returner;    
}

var extract = exports.extract = function(input, callback) {
    var data = {};

    if (input) {
        
        request({
            uri: input,
            encoding: null
        }, function(error, response, body) {
           // body is a Buffer. 
            try {
                new ExifImage({
                    image: body
                }, function (error, exifData) {
                    

                    
                    if (error || !exifData) {
                        // console.log('Error: ' + error.message);
                    } else {
                        
                        if (exifData.image) {
                            data.makeModel = [];
                            
                            if (exifData.image.Make) {
                                data.makeModel.push(exifData.image.Make);
                            }
                            if (exifData.image.Model) {
                                data.makeModel.push(exifData.image.Model);
                            }
                            
                            data.makeModel = data.makeModel.join(' ');
                        }
                        
                        if (exifData.exif) {
                            if (exifData.exif.DateTimeOriginal) {
                                data.dateTimeOriginal = exifData.exif.DateTimeOriginal;
                            }
                            
                            if (exifData.exif.CreateDate) {
                                data.dateTimeDigitized = exifData.exif.CreateDate;
                            }
                        }
                        
                        
                        console.log(exifData.gps);
            
                        if (exifData.gps && exifData.gps.GPSLatitudeRef && exifData.gps.GPSLongitudeRef) {
                            var lat = exifData.gps.GPSLatitude;
                            var long = exifData.gps.GPSLongitude;
            
                            var latHemisphere = exifData.gps.GPSLatitudeRef;
                            var longHemisphere = exifData.gps.GPSLongitudeRef;
                        
                            var decimalLat = toDecimal(lat[0], lat[1], lat[2], latHemisphere);
            
                            var decimalLong = toDecimal(long[0], long[1], long[2], longHemisphere);
            
                            console.log();
            
                            console.log('decimalLat:');
                            console.log(decimalLat + '\n');

                            console.log('decimalLong:');
                            console.log(decimalLong + '\n');
            
                            // Write coords to directory of input.
                            // var dirname = path.dirname(input);
            
                            data.decimalLat = decimalLat;
                            data.decimalLong = decimalLong;
                        }
            

            
                        // fs.writeFile(path.join(dirname, 'coords.json'), JSON.stringify(json, null, 4), function(err) {
                        //     if (err) {
                        //         throw err;
                        //     }
                        //     console.log('Saved to coords.json');
                        // });
                
                  
                
            
                    }
                    
                    callback(data);
            
            
                });
            } catch (error) {
                // console.log('Error: ' + error.message);
                callback(data);
            }
        
        });
    } else {
        callback(data);
    }
};
