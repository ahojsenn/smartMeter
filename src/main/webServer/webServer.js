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
var Transform 	= stream.Transform;
var WrapWithCallback  = require ("./WrapWithCallback.js"),
    Zip = require ("./zip.js");

var	global 		=  global || require ("../../main/global/global.js").init("from webServer"),
	DataBase 	= new require ("../../main/dataBase/dataBase.js"),
	dataBase 	= new DataBase ({"dataFileName" : global.datafilename});

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
				.listen(global.serverPort);
//				.listen(global.serverPort,  '::');
	console.log('Server is running at http://127.0.0.1:'+global.serverPort);
	return app;
}


/**
	parse the request and construct the server response
*/
function parseRequestAndRespond (request, response) {
    var zip 		= new Zip(request, response),
		fs 			= require('fs'),
		requestPath = require('url').parse(request.url, true).pathname,
		filter  	= getUrlParameter (request, 'filter') || '',
		callback 	= getUrlParameter (request, 'callback'),
		noLines 	= getUrlParameter (request, 'nolines') || 23,
		column 		= getUrlParameter (request, 'column') || '',
		wrap 		= new WrapWithCallback(callback),
		reqMethod 	= requestPath.split('/').pop(),
		map2Method 	= {  	// here I map requests to functions...
			"getXref" 		: { func: dataBase.getXref(noLines, column) },
			"getData" 		: { func: dataBase.getData(noLines, filter) },
			"getnolines"	: { func: dataBase.getNoLines(noLines) },
			"getfirst" 		: { func: dataBase.getFirst() },
			"getlast" 		: { func: dataBase.getLast() },
			"getglobals"	: { func: dataBase.getGlobals() }
		};

	global.log ("got request... req="+requestPath);

	request.on('end', function () { global.log ("...answered request "+ requestPath) } );

	if ( map2Method[reqMethod] )
		map2Method[reqMethod].func
			.pipe(wrap)
			.pipe(zip)
			.pipe(response);
	// serve a static files under url "+/client/"
	else if ( (requestPath.indexOf(global.url+'/client/') == 0 ) ){
		fs.createReadStream(global.srcPath+'main/client/' + reqMethod)
			.pipe(zip)
			.pipe(response);
	}
	else {// the last catch, if it comes here it aint good...
		global.log ('ERROR in parseRequestAndRespond, last else..., requestPath='+requestPath);
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.end();
	}
}


/**
   	start a Web-Socket that will deliver data on every new entry of the datafile
	last refactored: 20130411, JM
*/
function WebSocket () {
//	global.log('in myWebSocket');
	var objref = this;

	this.startDataListener = function (socket) {
		var tailDB = dataBase.tailDB();
		tailDB.on ('data', function (data) {
			var lines = data.toString().split('\n');
			for (var i in lines) {
				if ( (typeof socket === 'object') && (lines[i]) ) {
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
//				global.log ("webServer:startSocket.sockets.on connection...");
				objref.startDataListener(socket);
			});
		return this;
	};

	return this;
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

/**
	a json parser with error throwing...
*/
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

