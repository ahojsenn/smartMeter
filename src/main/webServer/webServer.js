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
var	global = (typeof global != 'undefined' ) 
		? global 
		: require ("../../main/global/global.js").init("from webServer"),
	dataBase = require ("../../main/dataBase/dataBase.js");

// the webServer Object
var ws = {
		start: startWebServer,
		dataBase: require ("../../main/dataBase/dataBase.js")
	};

// now start the webServer
ws.start();

// make it requirable...
module.exports = ws;



/**
	the http server is started on global.serverPort and a websocket is also started
*/
function startWebServer() {
	global.log ("in startWebServer...");
	var app = require('http').createServer(function (request, response) {
  		response.writeHead(200, {'Content-Type':'text/plain'});
  		parseRequestAndRespond (request, response);
	}).listen(global.serverPort,  '::');

	global.log('Server is running at http://127.0.0.1:'+global.serverPort);

	// start a Web-Socket
	var webSocket = new myWebSocket ();
	webSocket
		.startSocket (app)
		.startDataListener (global.datafilename);
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
		mapRequestToMethod = {  // I do not use this yet, but keep followin g the idea
			"/getData" 		: "getData",
			"/getnolines" 	: "getNoLines"
		};
	global.log ('in parseRequestAndRespond..., requestPath='+requestPath);



	if (requestPath == global.url+'/getXref')
		dataBase.getXref (noLines, column, function (data) {
			response.end(wrapWithCallback(data, callback) );
		});

	else if (requestPath == global.url+'/getData')
		dataBase.getData (noLines, filter, function (data) {
			response.end(wrapWithCallback(data, callback) );
		});

	// get nolines returns the number of lines in the data
	else if (requestPath == global.url+'/getnolines')
		dataBase.getNoLines (filter, function (data) {
			response.end(wrapWithCallback(data, callback) );
		});

	// getfirst gets the first entry in the dta file
	else if (requestPath == global.url+'/getfirst')
		dataBase.getFirst ( function (data) {
			response.end(wrapWithCallback(data, callback) );
		});

	// getlast gets the last entry
	else if (requestPath == global.url+'/getlast')
		dataBase.getLast ( function (data) {
			response.end(wrapWithCallback(data, callback) );
		});

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
function myWebSocket () {

	global.log('in myWebSocket');
	var objref = this;

	this.setSocket = function (socket) { this.socket = socket; return this; };

	this.startDataListener = function (filename) {
		global.log ('started dataListener on file: '+ filename);
		var tail  = require('child_process')
			.spawn('tail', ['-f', '-n1', filename])
			.stdout.on ('data',
				function (data) {
		  			global.log('in dataListener, data: '+  data );
					if ( (typeof objref.socket === 'object') ) {
						global.log('objref.socket.emit (news, data):' + data);
						// Trigger the web socket now
						objref.socket.emit ('got new data', JSON.parse (data) );
					}
				});
		return this;
	};

	this.startSocket = function (app) {
		var io = require('socket.io')
			.listen(app)
			.sockets.on('connection', function (socket) {
				objref.setSocket (socket);
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
