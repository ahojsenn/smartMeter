var assert = require("assert"),
	ws = require ("../../webServer/webServer.js"),
	http = require ("http")
	;


/* init and start the webServer */ 
before(function(done){
	// wait for the ws initialization and start to be done...

	http.get('http://localhost:42080/smartMeter/client/index.html', function (res) {
    assert.equal(200, res.statusCode);
    done();
	})
})


describe ('webServer', function () {		
	/* initializes */
  describe('has a property called serverPort with a positive value', function () {
    it ('should return a postive integer 1025 < serverPort < 65536', function () {
      assert (ws.serverPort > 1024);
      assert (ws.serverPort < 65536);
    })
  })

  /* the log function logs on DEBUG to the console */

  /* start */
	describe('/listens on port '+ ws.serverPort, function () {
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

      console.log("...waiting for new data ");
      client.on('got new data', function (data) {
        console.log("got new data "+data);
        done();
        });
    })


  });



});