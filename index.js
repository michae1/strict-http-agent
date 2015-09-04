var http = require('http'),
    util = require('util'),
    TimedQueue = require('simple-timed-queue'),
    debug = function noop() {};
    if (util.debuglog != null) {
      debug = util.debuglog("http")
    }

function strictAgent(options){
    var self = this;
    http.Agent.call(this, options);
    self.queueLimit = options.queueLimit || 10000000;
    self.queueTTL = parseInt(options.queueTTL) || undefined;
}

function adoptedTimedQueue(ttl, delta){
    TimedQueue.call(this, ttl, delta);
    // Adopt TimedQueue to be integrated as array:
    this.push = this.enqueue; 
    this.shift = this.dequeue; 
}

util.inherits(adoptedTimedQueue, TimedQueue);

util.inherits(strictAgent, http.Agent);

strictAgent.prototype.getRequestStore = function(){
    if ('queueTTL' in this.options && this.options.queueTTL){
        return new adoptedTimedQueue(this.options.queueTTL);
    } else {
        return new Array();
    }
}

if (process.version.match(/^v(\d+\.\d+)/)[1] == '0.10'){
    // Node 0.10 integration and additional methods
    strictAgent.prototype.getName = function(options) {
        var name = options.host + ':' + options.port;
            if (options.localAddress) {
                name += ':' + options.localAddress;
        }
        return name;
    }
    strictAgent.prototype.addRequest = function(req, host, port, localAddress) {
        if (typeof(host) === 'object'){
            // Compatibility with libs compatible only with 0.11+ 
            var options = host;
            host = options.host;
            port = options.port;
            localAddress = options.localAddress;
        }
        var name = host + ':' + port;
        if (localAddress) {
            name += ':' + localAddress;
        }
        if (!this.sockets[name]) {
            this.sockets[name] = [];
        }
        if (this.sockets[name].length < this.maxSockets) {
            // If we are under maxSockets create a new one.
            req.onSocket(this.createSocket(name, host, port, localAddress, req));
        } else {
            // We are over limit so we'll add it to the queue.

            if (!this.requests[name]) {
              this.requests[name] = this.getRequestStore();
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

} else {
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
                this.requests[name] = this.getRequestStore();
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

}

module.exports = strictAgent;