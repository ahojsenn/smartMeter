#!/usr/bin/env node
/*jslint node: true */
/*
	Johannes Mainusch
	Start: 2013-03-02
	refactored: 2014-02-**
	Idea:
	The server serves data in json format from files
	The Data is in the file 'global.datafilename'
*/
var stream 		= require('stream');
var util 		= require('util');
var Transform 	= stream.Transform || require('readable-stream').Transform;
var WrapWithCallback  = require ("./WrapWithCallback.js");

var	global 		=  global || require ("../../main/global/global.js").init("from webServer"),
	DataBase 	= new require ("../../main/dataBase/dataBase.js"),
	dataBase 	= new DataBase;

// the webServer Object
var ws = {
		start: startWebServer,
		webSocket:  new WebSocket()
	};

// now start the webServer
var app = ws.start();

// start a Web-Socket
ws.webSocket.startSocket(app);

// make it requirable...
module.exports = ws;



/**
	the http server is started on global.serverPort and a websocket is also started
*/
function startWebServer() {
	var app = require('http')
				.createServer( function (request, response) {
  					parseRequestAndRespond (request, response);
					})
				.listen(global.serverPort,  '::');
	global.log('Server is running at http://127.0.0.1:'+global.serverPort);
	return app;
}


/**
	parse the request and construct the server response
*/
function parseRequestAndRespond (request, response) {
	var requestPath = require('url').parse(request.url, true).pathname,
		params = require('url').parse(request.url, true),
		filter  = getUrlParameter (request, 'filter'),
		callback = getUrlParameter (request, 'callback'),
		noLines = getUrlParameter (request, 'nolines') 
					? getUrlParameter (request, 'nolines') :23,
		column = getUrlParameter (request, 'column'),
		wrap = new WrapWithCallback(callback),
		mapRequestToMethod = {  // I do not use this yet, but keep following the idea
			"/getData" 		: "getData",
			"/getnolines" 	: "getNoLines"
		},
		result = '';
	global.log ('in parseRequestAndRespond..., requestPath='+requestPath);



	if (requestPath == global.url+'/getXref') {
		dataBase
			.getXref (noLines, column)
			.pipe(wrap)
			.pipe(response);
	}

	else if (requestPath == global.url+'/getData') {
		dataBase
			.getData (noLines, filter)
			.pipe (wrap)
			.pipe (response);
	}

	// get nolines returns the number of lines in the data
	else if (requestPath == global.url+'/getnolines') {
		dataBase
			.getNoLines(filter)
			.pipe (wrap)
			.pipe(response);
	}

	// getfirst gets the first entry in the dta file
	else if (requestPath == global.url+'/getfirst')
		dataBase
			.getFirst()
			.pipe (wrap)
			.pipe(response);


	// getlast gets the last entry
	else if (requestPath == global.url+'/getlast')
		dataBase
			.getLast()
			.pipe (wrap)
			.pipe(response);

	// getglobal returns the global object to the client to transport server info
	else if (requestPath == global.url+'/getglobals') {
		response.end( wrapWithCallback( JSON.stringify(global), callback));
	}

	// server static files under url "+/client/"
	else if ( (requestPath.indexOf(global.url+'/client/') == 0 ) ){
		serveStaticFile (request, response);
	}
	else {// the last catch, if it comes here it aint good...
		global.log ('ERROR in parseRequestAndRespond, last else..., requestPath='+requestPath);
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.end();
	}
}



/**
 * myModGzip is my poor mans try to compress data...
 * inspired by http://nodejs.org/api/zlib.html
 */
function myModGzip (request, response, raw) {
	var zlib = require('zlib'),
		acceptEncoding = request.headers['accept-encoding'];
  	if (!acceptEncoding) {
    	acceptEncoding = '';
  	}

  	// Note: this is not a conformant accept-encoding parser.
  	// See http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.3
  	if (acceptEncoding.match(/\bdeflate\b/)) {
    	response.writeHead(200, { 'content-encoding': 'deflate' });
    	raw.pipe(zlib.createDeflate()).pipe(response);
  	} else if (acceptEncoding.match(/\bgzip\b/)) {
    	response.writeHead(200, { 'content-encoding': 'gzip' });
    	raw.pipe(zlib.createGzip()).pipe(response);
  	} else {
    	response.writeHead(200, {});
    	raw.pipe(response);
  	}
}


/**
	wrap the data with a callback
 */
function wrapWithCallback (data, callback) {
	if (typeof callback === 'string')
		return callback + "("+data+")";
	else
		return data;
}

/**
   	start a Web-Socket that will deliver data on every new entry of the datafile
	last refactored: 20130411, JM
*/
function WebSocket () {
	global.log('in myWebSocket');
	var objref = this;

	this.startDataListener = function (socket) {
		var tailDB = dataBase.tailDB(dataBase);
		global.log ('webServer:myWebSocket, starting dataBase.tailDB().tail.on...');

//		tailDB.tail.pipe(socket);  // that would be cool... but does not work
		global.log("webServer:myWebSocket, stream.ObjectID="+tailDB.ObjectID);
		tailDB.on ('data', function (data) {
			global.log('webServer:myWebSocket, in dataListener, data: '+  data );
			global.log('webServer:myWebSocket, in dataListener, socket: '+  socket );
			var lines = data.toString().split('\n');
			for (var i in lines) {
				if ( (typeof socket === 'object') && (lines[i]) ) {
					global.log('webServer:myWebSocket, socket.emit, data:' + lines[i]);
					// Trigger the web socket now
					socket.emit ('tailDB', parseJSON(lines[i]));
				}
			}
		})
	};

	this.startSocket = this.startSocket || function (app) {
		global.log ("webServer:startSocket...");
		var io = require('socket.io')
			.listen(app)
			.sockets
			.on('connection', function (socket) {
				global.log ("webServer:startSocket.sockets.on connection...");
				objref.startDataListener(socket);
			});
		return this;
	};

	return this;
}

/**
	getFilename parses the request and gets the filename
*/
function getFilename (request) {
	var requestPath = require('url').parse(request.url, true).pathname,
		myfilename = requestPath.substring (requestPath.lastIndexOf('/')+1);
	return myfilename;
}

/**
	getMimetype parses the request and determines the mimetype
*/
function getMimetype (request) {
	var requestPath = require('url').parse(request.url, true).pathname,
		myMimeType = "text/plain",
		myFileending = requestPath.substring (requestPath.lastIndexOf('.')+1);

		switch (myFileending) {
			case "js":
				myMimeType = "text/javascript";
				break;
			case "css":
				myMimeType = "text/css";
				break;
			case "html":
				myMimeType = "text/html";
				break;
			}
	return myMimeType;
}

/**
	serveStaticFile parses the request and gets the filename and responds
*/
function serveStaticFile (request, response) {
	var myfilename = getFilename (request),
		myMimeType = getMimetype (request),
		fs = require('fs');
	fs.readFile(global.srcPath+'main/client/' + myfilename, "binary", function (err, file) {
		global.log ('readFile: ' +global.srcPath+ './client/' + myfilename);
		if (err) {
			global.log ('ERROR readFile: ' + './client/' + myfilename);
		    response.writeHead(500, {"Content-Type": "text/plain"});
		    response.write(err + "\n");
		    response.end();
		    return;
		}
		global.log ('response.write: ' + './client/' + myfilename);
		response.writeHead(200, {"Content-Type": myMimeType});
		response.write(file, "binary");
		response.end();
		global.log ('response.end: ' + './client/' + myfilename);
	});
}


/**
	getUrlParameter will parse the selector parameter from the request if present
*/
function getUrlParameter (request, selector) {
	var params = require('url').parse(request.url, true),
		urlParameter = false;

	if (params.query.hasOwnProperty(selector) === true
		&& typeof params.query[selector] === 'string' )
		urlParameter = params.query[selector];

	return urlParameter;
}


function parseJSON (data) {
	var foo;
	try {
  		foo = JSON.parse(data);
	} catch (e) {
  		// An error has occured, handle it, by e.g. logging it
  		console.log("ERROR in parseJSON (data), data="+data);
  		console.log(e);
	}
	return foo;
}

