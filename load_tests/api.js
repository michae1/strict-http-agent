'use strict';

var strictAgent = require("../index"),
    rest = require("restler"),
    http = require("http"),
    strictAgentLimits = new strictAgent({ maxSockets: 100, queueLimit: 100 }),
    strictAgentTimeouts = new strictAgent({ maxSockets: 100, queueLimit: 200, queueTTL: 1000 }),
    httpAgent = new http.Agent({ maxSockets: 100 }),
    Promise = require("es6-promise").Promise;
              
var dataToSend = { // just random json
    "nm": "Richard III",
    "cty": "United Kingdom",
    "hse": "House of York",
    "yrs": "1483-1485",
    "extra" : {
        "key": "537b0b35d241d7137654733500c60789537b0b35d241d7137654733500c60789537b0b35d241d7137654733500c60789537b0b35d241d7137654733500c60789537b0b35d241d7137654733500c60789"
    } 
}           

module.exports = function (server) {
    server.get('/strictedcall', function(req, res, next) {
        return new Promise(function(resolve, reject) {
                rest.get('http://localhost:3000/someslowcall', {
                        agent: strictAgentLimits,
                        data: dataToSend
                    })
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
    server.get('/strictedcallttl', function(req, res, next) {
        return new Promise(function(resolve, reject) {
                rest.get('http://localhost:3000/someslowcall', {
                        agent: strictAgentTimeouts,
                        data: dataToSend
                    })
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
    server.get('/usualcall', function(req, res, next) {
        return new Promise(function(resolve, reject) {
                rest.get('http://localhost:3000/someslowcall', {
                        agent: httpAgent,
                        data: dataToSend
                    })
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