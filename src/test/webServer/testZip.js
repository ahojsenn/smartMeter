var assert = require("assert"),
    global = global || require ("../../main/global/global.js").init("Test"),
    fs = require("fs"),
    Zip = require ("../../main/webServer/zip.js");


/* connect to the 'dataBase' and prepare everything */
before(function(done){
  this.timeout(12042);
  // write some stuff to the datafile for  further testing
  done();
})

after (function (done) {
  done();
})


describe ('zip is a stream object, and...', function () {
  it ('I can pipe things to zip...', function (done) {
    var http = require('http');
    var request = {hostname : 'localhost', port:'8042','headers' : {'accept-encoding' : 'gzip'}};

    var webServer = require('http')
        .createServer( function (request, response) {
          var testData01= '{"term" : "hugo", "Watt" : 0.42, "timestamp": 1419266112003}';
          var testData02= '{"term" : "kaefer", "Watt" : 0.42, "timestamp": 1419266112003}';
          var testData="[";
          for (var i=0; i<600; i++) testData += testData01+",\n";
          testData += testData02+"]";
          var testData_echo  = require('child_process').spawn("echo", [testData]);
          var zip = new Zip(request, response);
//          global.log("started a server,...");
          testData_echo
            .stdout
            .pipe (zip)
            .pipe (response)
          })
        .listen(8042);

    http.get(request, function (response) {
      var result = [];
      var zlib = require('zlib');
      response
        .on ("data", function (chunk) { result.push(chunk) })
        .on ("end", function () {
            zlib.gunzip( Buffer.concat(result),
              function (error, data) {
                var lines = JSON.parse (data);
                for (var i in lines ) {
                  if (lines[i].term === 'kaefer') {
                    webServer.close()
                    done();
                  }
                }
              })
        });
    })
    //
  })
})

// =========
function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}