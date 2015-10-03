'use strict';

var Promise = require("es6-promise").Promise;
              
module.exports = function (server) {
    server.get('/someslowcall', function(req, res, next) {
        return new Promise(function(resolve, reject) {
                setTimeout(function(){
                    resolve();
                }, 1000);
            }).then(function(){
                res.send({'data':'no'});
                return next();
            }, function(err){
                console.log('Error: ', err);
            })
    });
}