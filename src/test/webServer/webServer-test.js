var assert = require("assert"),
  global = require ('../../main/global/global.js'),
  ws,
	http = require ("http")
	;


/* init and start the webServer */ 
before(function(done){
  this.timeout(5000);
  console.log ("in webServer-test.js ...");
  global.datafilename = "/tmp/testData.json";

  ws =  require ("../../main/webServer/webServer.js");
	// wait for the ws initialization and start to be done...
	http.get('http://localhost:42080/smartMeter/client/index.html', function (res) {
    assert.equal(200, res.statusCode);
    done();
	})
})


describe ('the webServer', function () {		
	/* initializes */
  describe('has a property called serverPort with a positive value', function () {
    it ('should return a postive integer 1025 < serverPort < 65536', function () {
      assert (ws.serverPort > 1024);
      assert (ws.serverPort < 65536);
    })
  })
});

/* start */
describe('runs and...', function () {
  it('should return 200', function (done) {
    http.get('http://localhost:'+ws.serverPort+'/smartMeter/get', function (res) {
      assert.equal(200, res.statusCode);
      done();
    });
  });

  /* a webserver is also started on ipv6 */
  it('should return 200', function (done) {
    http.get('http://[::1]:'+ws.serverPort+'/smartMeter/get', function (res) {
      done();
    });
  });

  /* and there is a websocket sending stuff */
  it ('broadcasts new energy value to client', function (done) {
    var      
      socketURL = 'http://localhost:'+ws.serverPort,
      options ={
        transports: ['websocket'],
        'force new connection': true
        },
      io = require('socket.io-client'),
      client = io.connect(socketURL, options);

    this.timeout(5000);
    console.log ("-----> need data, waiting...");
    client.on('got new data', function (data) {
      console.log ("-----> got data, done...");      
      done();
      });
  })
  
  // now test the get method of my webServer
  it ('has a /get method implemented that lists some datafile entries', function (done) { 
    var url = 'http://localhost:'+ws.serverPort+'/smartMeter/get?nolines=20';

    http.get( url, function (res) {
      assert.equal(200, res.statusCode);
      res.on ('data', function (chunk) {
        assert (chunk.length > 0);
        done();
      });
    })      
  });

  // now test the get method of my webServer
  it ('has a /getnolines method implemented...', function (done) { 
    var url = 'http://localhost:'+ws.serverPort+'/smartMeter/getnolines';
    http.get( url, function (res) {
      assert.equal(200, res.statusCode);
      res.on ('data', function (chunk) {
        assert (chunk.length > 0);
        done();
      });
    })      
  });

  // now test the get method of my webServer
  it ('has a /getfirst method implemented...', function (done) { 
    var url = 'http://localhost:'+ws.serverPort+'/smartMeter/getfirst';
    http.get( url, function (res) {
      assert.equal(200, res.statusCode);
      res.on ('data', function (chunk) {
        assert (chunk.length > 0);
        done();
      });
    })      
  });

  // now test the get method of my webServer
  it ('has a /getlast method implemented...', function (done) { 
    var url = 'http://localhost:'+ws.serverPort+'/smartMeter/getlast  ';
    http.get( url, function (res) {
      assert.equal(200, res.statusCode);
      res.on ('data', function (chunk) {
        assert (chunk.length > 0);
        done();
      });
    })      
  });

  // now test the getnolines method of my webServer with callback parameter
  it ('works with callback parameter', function (done) { 
    var url = 'http://localhost:'+ws.serverPort+'/smartMeter/getnolines?callback=blubberblubber';

    http.get( url, function (res) {
      assert.equal(200, res.statusCode);
      res.on ('data', function (chunk) {
        assert ( chunk.toString().indexOf("blubberblubber") == 0);
        done ();
        });
      })      
    });


});






  