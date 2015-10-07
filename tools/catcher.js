// Load the http module to create an http server.
var http = require('http');

// Configure our HTTP server to respond with Hello World to all requests.
var server = http.createServer(function (request, response) {
  console.log('got connection')
  setTimeout(function(){
    console.log('response send')
    response.writeHead(200, {"Content-Type": "text/plain"});
    response.end("Hello World\n");
  }, 1000)

});

// Listen on port 8000, IP defaults to 127.0.0.1
server.listen(8000);

// Put a friendly message on the terminal
console.log("Server running at http://127.0.0.1:8000/");