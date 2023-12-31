#!/usr/bin/env node
/* jslint node: true */
/*
	Johannes Mainusch
	Start: 2013-03-02
	refactored: 2014-02-**
	Idea:
	The server serves data in json format from files
	The Data is in the file 'global.datafilename'
*/
const stream = require('stream')
const WrapWithCallback = require('./WrapWithCallback.js')
const Zip = require('./zip.js')

var global = global || require('../../main/global/global.js').init('from webServer')
const DataBase = require('../../main/dataBase/dataBase.js')
const dataBase = new DataBase({ dataFileName: global.datafilename })

// the webServer Object
const ws = {
  start: startWebServer,
  webSocket: new WebSocket(),
}

// now start the webServer
const app = ws.start()

// start a Web-Socket
ws.webSocket.startSocket(app)

// make it requirable...
module.exports = ws

/**
	the http server is started on global.serverPort and a websocket is also started
*/
function startWebServer() {
  const app = require('http')
    .createServer(function (request, response) {
      parseRequestAndRespond(request, response)
    })
    .listen(global.serverPort)
  //				.listen(global.serverPort,  '::');
  console.log('Server is running at http://127.0.0.1:' + global.serverPort)
  return app
}

/**
	parse the request and construct the server response
*/
function parseRequestAndRespond(request, response) {
  const zip = new Zip(request, response)
  const fs = require('fs')
  const requestPath = require('url').parse(request.url, true).pathname
  const filter = getUrlParameter(request, 'filter') || ''
  const callback = getUrlParameter(request, 'callback')
  const noLines = getUrlParameter(request, 'nolines') || 23
  const column = getUrlParameter(request, 'column') || ''
  const wrap = new WrapWithCallback(callback)
  const reqMethod = requestPath.split('/').pop()
  const map2Method = {
    // here I map requests to functions...
    getXref: { func: dataBase.getXref(noLines, column) },
    getData: { func: dataBase.getData(noLines, filter) },
    getnolines: { func: dataBase.getNoLines(noLines) },
    getfirst: { func: dataBase.getFirst() },
    getlast: { func: dataBase.getLast() },
    getglobals: { func: dataBase.getGlobals() },
  }

  global.log('got request... req=' + requestPath)

  // log the end of the response
  response.on('finish', function () {
    global.log('...answered request ' + requestPath)
  })

  if (map2Method[reqMethod])
    map2Method[reqMethod].func.pipe(wrap).pipe(zip).pipe(response)
  // serve a static files under url "+/client/"
  else if (requestPath.indexOf(global.url + '/client/') === 0) {
    fs.createReadStream(global.srcPath + 'main/client/' + reqMethod)
      .pipe(zip)
      .pipe(response)
  } else {
    // the last catch, if it comes here it aint good...
    global.log(
      'ERROR in parseRequestAndRespond, last else..., requestPath=' +
        requestPath
    )
    response.writeHead(500, { 'Content-Type': 'text/plain' })
    response.end()
  }
}

/**
   	start a Web-Socket that will deliver data on every new entry of the datafile
	last refactored: 20130411, JM
*/
function WebSocket() {
  //	global.log('in myWebSocket');
  const objref = this

  this.startDataListener = function (socket) {
    const tailDB = dataBase.tailDB()
    tailDB.on('data', function (data) {
      const lines = data.toString().split('\n')
      for (const i in lines) {
        if (typeof socket === 'object' && lines[i]) {
          // Trigger the web socket now
          socket.emit('tailDB', parseJSON(lines[i]))
        }
      }
    })
  }

  this.startSocket =
    this.startSocket ||
    function (app) {
      global.log('webServer:startSocket...')
      const io = require('socket.io')
        .listen(app, {
          //allowEIO3: true, // false by default
          serveClient: true,
          // below are engine.IO options
          pingInterval: 10000,
          pingTimeout: 50000,
          //cookie: false,
          allowUpgrades: false,
          //transports: ['websocket'],
          reconnection: false,
          autoConnect: false,
        })
        .sockets.on('connection', function (socket) {
          global.log ("webServer:startSocket.sockets.on connection...");
          objref.startDataListener(socket)
          socket.on("disconnect", (reason) => {
            console.log("disconnect, because: "+reason); // "ping timeout"
          });
        })
       
      return this
    }

  return this
}

/**
	getMimetype parses the request and determines the mimetype
*/
function getMimetype(request) {
  const requestPath = require('url').parse(request.url, true).pathname
  let myMimeType = 'text/plain'
  const myFileending = requestPath.substring(requestPath.lastIndexOf('.') + 1)
  switch (myFileending) {
    case 'js':
      myMimeType = 'text/javascript'
      break // 'application/javascript';
    case 'css':
      myMimeType = 'text/css'
      break
    case 'html':
      myMimeType = 'text/html'
      break
  }
  return myMimeType
}

/**
	getUrlParameter will parse the selector parameter from the request if present
*/
function getUrlParameter(request, selector) {
  const params = require('url').parse(request.url, true)
  const url = new URL(request.url, `http://${request.headers.host}/`)
  let urlParameter = false
  // extract the parameter from the query
  // ?nolines=1000&column=term&_=1681235175790
  const urlParams = new URLSearchParams(url.search)
  console.log(
    '\n\ngetUrlParameter.getUrlParameter, selector=',
    selector,
    request.url
  )
  console.log('getUrlParameter.getUrlParameter, urlParams=', urlParams)
  console.log(
    'getUrlParameter.getUrlParameter, urlParams.has(selector)=',
    urlParams.has(selector)
  )
  console.log(
    'getUrlParameter.getUrlParameter, urlParams.get(selector)=',
    urlParams.get(selector)
  )
  if (urlParams.has(selector)) urlParameter = urlParams.get(selector)
  console.log('returning: urlParams.get(selector)=', urlParameter)
  return urlParameter
}

/**
	a json parser with error throwing...
*/
function parseJSON(data) {
  let foo
  try {
    foo = JSON.parse(data)
  } catch (e) {
    // An error has occured, handle it, by e.g. logging it
    console.log('ERROR in parseJSON (data), data=' + data)
    console.log(e)
  }
  return foo
}
