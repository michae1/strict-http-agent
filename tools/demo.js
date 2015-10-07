var strictAgent = require("../index"),
    agent = new strictAgent({ maxSockets: 2, queueLimit: 10, queueTTL: 3020 }),
    http = require("http"),
    rest = require("restler");

console.log('Starting at ', getMyTime());
for (var i=0; i<10; i++){
    closure(i);
}
function getMyTime(){
    var today = new Date();
    var h = today.getHours();
    var m = today.getMinutes();
    var s = today.getSeconds();
    return h + ":" + m + ":" + s;
}
function closure(i) {
    console.log('Request #', i, 'start')
    rest.get('http://localhost:8000/?'+i, {
            agent: agent
        })
        .on('success', function(data) {
            console.log("Got data for request#", i, data);
        })
        .on('error', function(err){
            console.log("Got error for request#", i, err);
        });
}

setTimeout(function(){
    console.log('end')
}, 5000)