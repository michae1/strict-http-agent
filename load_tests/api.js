'use strict';

var strictAgent = require("../index"),
    rest = require("restler"),
    http = require("http"),
    agent = new strictAgent({ maxSockets: 100, queueLimit: 1 }),
    //agent = new http.Agent({ maxSockets: 100 }),
    Promise = require("es6-promise").Promise
              
module.exports = function (server) {
    server.get('/somecall', function(req, res, next) {
        return new Promise(function(resolve, reject) {
                rest.get('http://localhost:3000/someslowcall')
                    .on('complete', function(data) {
                        resolve(data);
                    })
                    .on('error', function(err){
                        reject(err);
                    })
                    .on('abort', function(err){
                        reject(err);
                    });
            })
            .then(function(){
                    res.send({'data':'no'});
                    return next();
                }, function(err){
                    console.log('Connection error')
            })
    });
}