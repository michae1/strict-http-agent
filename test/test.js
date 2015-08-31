var assert = require("assert"),
    strictAgent = require("../index"),
    PassThrough = require('stream').PassThrough,
    httpMocks = require('node-mocks-http'),
    Promise = require("bluebird");

routeHandler = function( request, response ) { 
    // posible additional conversions
}


describe('StrictAgent', function() {
    describe('queue restriction', function () {
        it('should not accept new requests when queue is full', function (done) {
            var agent = new strictAgent({ maxSockets: 1, queueLimit: 1 }),
                request  = httpMocks.createRequest({
                    method: 'GET',
                    url: '/',
                }),
                response = httpMocks.createResponse(),
                expectedErrNum = 5,
                raisedErrorNum = 0,
                errorMessagesReceived = {};
        

            routeHandler(request, response);

            // Mocking request methods:

            request.getHeader = function(x){
                return null;
            }

            request.onSocket = function(x){
                return null;
            }

            request.emit = function(event, message){
                // Accumulate err strings
                errorMessagesReceived[arguments[1].toString()] = true;
                // Count error number
                raisedErrorNum += 1;
                if (raisedErrorNum == expectedErrNum){
                    var messageTypesNum = Object.keys(errorMessagesReceived).length;
                    assert.equal(messageTypesNum, 1);
                    done();  
                } else if (raisedErrorNum > expectedErrNum){
                    throw Error('Unexpected error events received');
                }
            }
            for (var i=0; i<7; i++){
                agent.addRequest(request, { host: 'localhost', port: '9999' })
            }
        });
    });
});
