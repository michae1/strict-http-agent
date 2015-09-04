
[![Build Status][travis-badge]][travis-url]
[![NPM Version][npm-image]][npm-url]

# strict-http-agent
Node.js HTTP Agent with strict queued requests limit

Main goal is to prevent this scenario:

Node process sending requests to some slow service. By default after reaching maxSockets, new requests are coming into unlimited queue (javascript array).
There are timeouts for requests which are in use, but not for those in queue.
After time there will be huge queue in memory.
This module prevents this situation by limiting queue size (fast way) and/or ttl for queues requests (slower).

Requires Node.js>=0.10 or io.js

## Usage
### HTTP get example:
```javascript
var strictAgent = require("strict-http-agent");
...
var myAgent = new strictAgent({ maxSockets: 10, queueLimit: 100000, queueTTL: 1000 });

var options = {
	host: 'localhost',
	port: 8000,
	path: '/',
	agent: myAgent
};

var req = http.get(options, function(res) {
		res.pipe( process.stdout );
	}).on('error', function(e) {
		...
	});
```

### queueLimit
Specifies max number of requests in queue

### queueTTL
Specified max ttl for queued requests

[travis-badge]: https://travis-ci.org/michae1/strict-http-agent.svg
[travis-url]: https://travis-ci.org/michae1/strict-http-agent
[npm-image]: https://img.shields.io/npm/v/strict-agent.svg
[npm-url]: https://npmjs.com/package/strict-agent
