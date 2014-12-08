var assert = require("assert"),
    global = (typeof global != 'undefined' ) ? global : require ("../../main/global/global.js").init("Test"),
    ws,
	  http = require ("http"),
    exec = require('child_process').exec
	  ;


/* init and start the webServer */
before(function(done){
  this.timeout(5000);
  global.datafilename = "/tmp/testData.json";

  ws =  require ("../../main/webServer/webServer.js");
	// wait for the ws initialization and start to be done...
	http.get('http://localhost:42080/smartMeter/client/index.html', function (res) {
    assert.equal(200, res.statusCode);
    done();
  })
})

/* test for some static pages */
describe ('the webServer', function () {
  /* initializes */
  it('serves the static file renderTable.js', function () {
    http.get('http://localhost:42080/smartMeter/client/renderTable.js', function (res) {
      assert.equal(200, res.statusCode);
    })
  })
});


/* switch on the webserver */
describe ('the webServer', function () {
	/* initializes */
  describe('has a property called serverPort with a positive value', function () {
    it ('should return a postive integer 1025 < serverPort < 65536', function () {
      assert (global.serverPort > 1024);
      assert (global.serverPort < 65536);
    })
  })
});

/* start */
describe('runs and...', function () {
  it('should return 200', function (done) {
    http.get('http://localhost:'+global.serverPort+'/smartMeter/getData', function (res) {
      assert.equal(200, res.statusCode);
      done();
    });
  });

  /* a webserver is also started on ipv6 */
  it('should return 200', function (done) {
    http.get('http://[::1]:'+global.serverPort+'/smartMeter/getData', function (res) {
      done();
    });
  });

  /* and there is a websocket sending stuff */
  it ('broadcasts new energy value to client', function (done) {
    this.timeout(12000);
    var
      socketURL = 'http://localhost:'+global.serverPort,
      options ={
        transports: ['websocket'],
        'force new connection': true
        },
      io = require('socket.io-client'),
      client = io.connect(socketURL, options);

    var firstTime = true;
    client.on('got new data', function (data) {
      if (firstTime) done();
      firstTime = false;
      });
  })

  // now test the get method of my webServer
  it ('has a /getData method implemented that lists some datafile entries', function (done) {
    var url = 'http://localhost:'+global.serverPort+'/smartMeter/getData?nolines=20';

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
    var url = 'http://localhost:'+global.serverPort+'/smartMeter/getnolines';
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
    var url = 'http://localhost:'+global.serverPort+'/smartMeter/getfirst';
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
    var url = 'http://localhost:'+global.serverPort+'/smartMeter/getlast  ';
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
    var url = 'http://localhost:'+global.serverPort+'/smartMeter/getnolines?callback=blubberblubber';

    http.get( url, function (res) {
      assert.equal(200, res.statusCode);
      res.on ('data', function (chunk) {
        assert ( chunk.toString().indexOf("blubberblubber") == 0);
        done ();
        });
      })
    });

  //
  it ('serves the global object under the url /smartMeter/getglobals', function (done) {
    var url = 'http://localhost:'+global.serverPort+'/smartMeter/getglobals';
    http.get( url, function (res) {
      assert.equal(200, res.statusCode);
      res.on ('data', function (chunk) {
        assert (chunk.length > 0);
        assert (JSON.parse(chunk).location == 'TestLocation')
        done();
      });
    })
  })

});






