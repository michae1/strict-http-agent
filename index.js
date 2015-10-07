var http = require('http'),
    util = require('util'),
    TimedQueue = require('simple-timed-queue'),
    debug = function noop() {};
    if (util.debuglog != null) {
      debug = util.debuglog("http");
    }

function strictAgent(options) {
    var self = this;
    http.Agent.call(this, options);
    self.queueLimit = options.queueLimit || 10000000;
    self.queueTTL = parseInt(options.queueTTL) || undefined;
    // rewrite free event listener
    self.removeAllListeners('free');

    self.on('free', function(socket, options) {
        var name = self.getName(options);
        debug('agent.on(free)', name);

        if (!socket.destroyed &&
            self.requests[name] && self.requests[name].length) {
          var queuedRequest = self.requests[name].shift(!!self.queueTTL);
          if (queuedRequest instanceof Array){
            var currentRequest = queuedRequest[0];
            var requestTimeout = currentRequest.setTimeout(queuedRequest[1], function(){
                currentRequest.emit('error', new Error('Request timeout while in socket stage.'));
                currentRequest.abort();
                currentRequest.end();
            });
            currentRequest.on('end', function () {
                // clear timeout
                clearTimeout( requestTimeout );
            });
            currentRequest.on('error', function () {
                // clear timeout
                clearTimeout( requestTimeout );
            });
            currentRequest.on('abort', function () {
                // clear timeout
                clearTimeout( requestTimeout );
            });
            currentRequest.onSocket(socket);
          } else  
            queuedRequest.onSocket(socket);
          if (self.requests[name].length === 0) {
            // don't leak
            delete self.requests[name];
          }
        } else {
          // If there are no pending requests, then put it in
          // the freeSockets pool, but only if we're allowed to do so.
          var req = socket._httpMessage;
          if (req &&
              req.shouldKeepAlive &&
              !socket.destroyed &&
              self.options.keepAlive) {
            var freeSockets = self.freeSockets[name];
            var freeLen = freeSockets ? freeSockets.length : 0;
            var count = freeLen;
            if (self.sockets[name])
              count += self.sockets[name].length;

            if (count >= self.maxSockets || freeLen >= self.maxFreeSockets) {
              self.removeSocket(socket, options);
              socket.destroy();
            } else {
              freeSockets = freeSockets || [];
              self.freeSockets[name] = freeSockets;
              socket.setKeepAlive(true, self.keepAliveMsecs);
              socket.unref();
              socket._httpMessage = null;
              self.removeSocket(socket, options);
              freeSockets.push(socket);
            }
          } else {
            self.removeSocket(socket, options);
            socket.destroy();
          }
        }
      });
    
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
        var store = new adoptedTimedQueue(this.options.queueTTL);
        store.on('expired', function(req){
            req.emit('error', new Error('Request timeout while in queue stage.'));
        });
        return store;
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