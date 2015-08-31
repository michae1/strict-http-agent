var http = require('http'),
    util = require('util'),
    debug = util.debuglog('http');

function strictAgent(options){
    var self = this;
    http.Agent.call(this, options);
    self.queueLimit = options.queueLimit || 10000000;
}

util.inherits(strictAgent, http.Agent);

strictAgent.prototype.addRequest = function(req, options) {
    if (typeof options === 'string') {
        options = {
            host: options,
            port: arguments[2],
            path: arguments[3]
        };
    }
    var name = this.getName(options);
    if (!this.sockets[name]) {
        this.sockets[name] = [];
    }

    var freeLen = this.freeSockets[name] ? this.freeSockets[name].length : 0;
    var sockLen = freeLen + this.sockets[name].length;

    if (freeLen) {
        // we have a free socket, so use that.
        var socket = this.freeSockets[name].shift();
        debug('have free socket');

        // don't leak
        if (!this.freeSockets[name].length)
            delete this.freeSockets[name];

        socket.ref();
        req.onSocket(socket);
        this.sockets[name].push(socket);
    } else if (sockLen < this.maxSockets) {
        debug('call onSocket', sockLen, freeLen);
        // If we are under maxSockets create a new one.
        req.onSocket(this.createSocket(req, options));
    } else {
        debug('wait for socket');
        // We are over limit so we'll add it to the queue.
        if (!this.requests[name]) {
            this.requests[name] = [];
        } 
        if (this.requests[name].length < this.queueLimit){
            this.requests[name].push(req);
        } else {
            process.nextTick(function(){
                req.emit('error', new Error('Requests queue is reached its limit, request rejected.'));
            });
        }
    }
};

module.exports = strictAgent;