const assert = require('assert')
var global = global || require('../../main/global/global.js').init('Test')
const ws = require('../../main/webServer/webServer.js')
const fs = require('fs')
const http = require('http')
const exec = require('child_process').exec

/* init and start the webServer */
before(function (done) {
  this.timeout(10042)
  fs.appendFile(
    global.datafilename,
    '{"timestamp":"2015-03-30T07:17:05.735Z", "term" : "blipp", "Watt" : 302.2}\n' +
      '{"timestamp":"2015-03-30T07:17:06.735Z", "term" : "blupp", "Watt" : 302.2}\n',
    function (err) {
      if (err) {
        console.log(err)
      } else {
        console.log(
          'in webServer-test: before, testdata appended to dataBase...'
        )
      }
    }
  )
  // wait for the ws initialization and start to be done...
  http.get(
    'http://localhost:42080/smartMeter/client/index.html',
    function (res) {
      assert.equal(200, res.statusCode)
      done()
    }
  )
})

/* test for some static pages */
describe('the webServer', function () {
  /* initializes */
  this.timeout(5542)
  it('serves the static file renderDataInTable.js', function () {
    http.get(
      'http://localhost:42080/smartMeter/client/renderDataInTable.js',
      function (res) {
        assert.equal(200, res.statusCode)
      }
    )
  })

  /* initializes */
  describe('has a property called serverPort with a positive value', function () {
    it('should return a postive integer 1025 < serverPort < 65536', function () {
      assert(global.serverPort > 1024)
      assert(global.serverPort < 65536)
    })
  })

  it('should return 200', function (done) {
    http.get(
      'http://localhost:' + global.serverPort + '/smartMeter/getData',
      function (res) {
        assert.equal(200, res.statusCode)
        done()
      }
    )
  })

  /* a webserver is also started on ipv6 */
  //  it('should return 200 with ipv6 request', function (done) {
  //    http.get('http://[::1]:'+global.serverPort+'/smartMeter/getData', function (res) {
  //      done();
  //    });
  //  });
  /*
  it('websocket broadcasts new energy value to client', function (done) {
    const socketURL = 'http://localhost:' + global.serverPort
    const options = { transports: ['websocket'], 'force new connection': true }
    const io = require('socket.io-client')
    const client = io.connect(socketURL, options)
    let first = true
    global.log(
      'in testWebServer: websocket broadcasts new energy value to client'
    )
    client.on('error', function (e) {
      global.log('...ERROR:' + e)
    })
    client.on('tailDB', function (data) {
      global.log('... client received event tailDB:' + JSON.stringify(data))
      assert(IsJsonString(JSON.stringify(data))) // function IsJsonString is from testDataBase.js
      if (data.term === 'brubbelwebsocket' && first) {
        first = false
        assert(data.Watt === 342.42)
        client.disconnect()
        return done()
      }
    })

    // now write something to the file to trigger
    // the dataBase:tailDB and ultimamtively the webServer:websocket
    client.on('connect', function () {
      global.log('...client connected')
      fs.appendFile(
        global.datafilename,
        '{"timestamp":"2015-03-30T07:17:07.735Z", "term" : "bribbel", "Watt" : 342.41}\n' +
          '{"timestamp":"2015-03-30T07:17:08.735Z", "term" : "brubbelwebsocket", "Watt" : 342.42}\n',
        function (err) {
          if (err) console.log(err)
        }
      )
    })
  })
*/

  // now test the get method of my webServer
  it('has a /getData method implemented that lists some datafile entries', function (done) {
    const url =
      'http://localhost:' + global.serverPort + '/smartMeter/getData?nolines=17'
    let result = ''
    http.get(url, function (res) {
      assert.equal(200, res.statusCode)
      res.on('data', function (chunk) {
        result += chunk
      })
      res.on('end', function () {
        assert(result.length > 0)
        assert(IsJsonString(JSON.stringify(result)))
        done()
      })
    })
  })

  // now test the get method of my webServer
  it('has a /getnolines method implemented...', function (done) {
    const url =
      'http://localhost:' + global.serverPort + '/smartMeter/getnolines'
    http.get(url, function (res) {
      assert.equal(200, res.statusCode)
      res.once('data', function (chunk) {
        assert(chunk.length > 0)
        done()
      })
    })
  })

  // now test the getfirst method of my webServer
  it('has a /getfirst method implemented...', function (done) {
    const url = 'http://localhost:' + global.serverPort + '/smartMeter/getfirst'
    http.get(url, function (res) {
      assert.equal(200, res.statusCode)
      res.once('data', function (chunk) {
        assert(chunk.length > 0)
        done()
      })
    })
  })

  // now test the getlast method of my webServer
  it('has a /getlast method implemented...', function (done) {
    const url =
      'http://localhost:' + global.serverPort + '/smartMeter/getlast  '
    http.get(url, function (res) {
      assert.equal(200, res.statusCode)
      res.once('data', function (chunk) {
        assert(chunk.length > 0)
        done()
      })
    })
  })

  // now test the getXref method of my webServer
  it('has a /getXref method implemented...', function (done) {
    const url =
      'http://localhost:' +
      global.serverPort +
      '/smartMeter/getXref?column=term'
    let result = ''
    http.get(url, function (res) {
      assert.equal(200, res.statusCode)
      global.log('in test getXref, res.statusCode=' + res.statusCode)
      res
        .on('data', function (chunk) {
          result += chunk
        })
        .on('end', function () {
          assert(result.length > 0)
          console.log('in test getXref, result:' + result)
          assert(result.toString().includes('blipp'))
          done()
        })
    })
  })

  // now test the getnolines method of my webServer with callback parameter
  it('getnolines works with callback parameter', function (done) {
    const url =
      'http://localhost:' +
      global.serverPort +
      '/smartMeter/getnolines?callback=blubberblubber'
    let result = ''
    http.get(url, function (res) {
      assert.equal(200, res.statusCode)
      res
        .on('data', function (chunk) {
          result += chunk
        })
        .on('end', function () {
          assert(result.toString().indexOf('blubberblubber') === 0)
          done()
        })
    })
  })

  //
  it('serves the global object under the url /smartMeter/getglobals', function (done) {
    const url =
      'http://localhost:' + global.serverPort + '/smartMeter/getglobals'
    http.get(url, function (res) {
      assert.equal(200, res.statusCode)
      res.on('data', function (chunk) {
        assert(chunk.length > 0)
        assert(JSON.parse(chunk).location === 'TestLocation')
        done()
      })
    })
  })
})

// =========
function IsJsonString(str) {
  try {
    JSON.parse(str)
  } catch (e) {
    global.log('surely this aint no json, str=' + str)
    return false
  }
  return true
}
