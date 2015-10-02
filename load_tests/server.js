'use strict';

var restify = require('restify'),
    server = restify.createServer({ 'name': 'api' });

server.use(restify.fullResponse());
server.use(restify.bodyParser());
server.use(restify.queryParser());

require('./api')(server);
require('./slow_api')(server);

server.listen(3000, function () {
  console.log('%s listening at %s', server.name, server.url);
});

// for tests needs
module.exports = server;

