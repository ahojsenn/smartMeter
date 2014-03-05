#!/usr/bin/env node
/*jslint node: true */
/*
	Johannes Mainusch
	Start: 2013-03-02
	refactored: 2014-02-**
	Idea: 
	The server serves data in json format from files
	The Data is in the file 'datafilename'	
*/
var global = require ('../global/global.js');

// the webServer Object
var ws = {
		eventEmitter: new (require('events').EventEmitter),

		init: initWebServer,
		start: startWebServer,
	};



// initialize the webserver
ws.eventEmitter.on('init', function () {global.log ('...webserver init done'); });

// start the webserver after ws.init()
ws.eventEmitter.on('init', ws.start );



// now initialize the webserver, and kickstart things
ws.init ();

// make it requirable...	
module.exports = ws;




/*
 * a nice constructor function (from Christopher) that reads the 
 * webServer.json file and populates the ws object
 */
function initWebServer (callback) {
	var objref = this,
		params = require ('./webServer.json'),
		i=0;

	// Simple constructor, links all parameters in params object to >>this<<
	if (params && Object.keys && Object.keys(params).length >= 1) {
		global.log ("initializing with params");
		
		Object.keys(params).forEach( function(param) {
			objref[param] = params[param];
			global.log ("setting this."+param+"="+ params[param]);

			if (++i == Object.keys(params).length ) {
				ws.eventEmitter.emit('init');
			}
		})
	}

	if (typeof callback == 'function') { // make sure the callback is a function
        callback.call(this); // brings the scope to the callback
    }
	return this;
}


/**
	the http server is started on ws.serverPort and a websocket is also started
*/ 
function startWebServer() {
	var app = require('http').createServer(function (request, response) {
  		response.writeHead(200, {'Content-Type':'text/plain'});
  		server_response (request, response);
		//  response.end( server_response (request) );
	}).listen(ws.serverPort,  '::');
	
	global.log('Server is running at http://127.0.0.1:'+ws.serverPort);

	// start a Web-Socket
	var webSocket = new myWebSocket ();
	webSocket
		.startSocket (app)
		.startDataListener (global.datafilename);
}


/** 
	parse the request and construct the server response
*/
function server_response (request, response) {
	global.log ('in server_response, request: ' + request.url);
	var path = require('url').parse(request.url, true).pathname;
	
	// parse the request
	global.log ('in server_response, pathname: ' + path );
	global.log ('in server_response, global.datafilename: ' + global.datafilename );
	if (path == ws.url+'/get') get (request, response, global.datafilename);		

	// get gets the last 100 or so entries in the datail
	else if (path == ws.url+'/getnolines') getnolines (request, response, global.datafilename);		

	// getfirst gets the first entry in the dta file
	else if (path == ws.url+'/getfirst') executethis (request, response, global.datafilename, 'head -1 ');		
	
	// getlast gets the last entry
	else if (path == ws.url+'/getlast') executethis (request, response, global.datafilename, 'tail -1 ');		
	
	// server static files under url "+/client/"
	else if ( (path.indexOf(ws.url+'/client/') == 0 ) ){
		var myfilename = path.substring (path.lastIndexOf('/')+1),
			myMimeType = "text/plain",
			myFileending = path.substring (path.lastIndexOf('.')+1);
		
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

		global.log ('serving static file: ' + myfilename + ", myFileending:" + myFileending + "  mimeType: " + myMimeType);
		
		var fs = require('fs');
		fs.readFile(global.srcPath+'main/client/' + myfilename, "binary", function (err, file) {
			global.log ('readFile: ' + './client/' + myfilename);
			
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
}

/**
	getfirst will return the first entry
*/
function executethis (request, response, filename, cmd) {
	global.log ('in executethis');	
	var params = require('url').parse(request.url, true),
		exec = require('child_process').exec,
		data;

	if (params.query.hasOwnProperty('filter') === true && typeof params.query.filter === 'string' ) 
		cmd = 'cat ' + filename + ' | grep ' + params.query.filter + " | " + cmd;
	else
		cmd = cmd + filename;
			
	exec(cmd, function (error, data) {
		global.log('callback in executethis, cmd: ' + cmd + "\n" +data);
		response.end( data );
	});
}

/**
	getnolines will return the number of lines in the file
*/
function getnolines (request, response, filename) {
	global.log ('in getnolines');	
	var params = require('url').parse(request.url, true),
		cmd = "cat " + filename,
		exec = require('child_process').exec,
		responseData="[";
		

		if (params.query.hasOwnProperty('filter') === true && typeof params.query.filter === 'string' ) 
			cmd += ' | grep ' + params.query.filter;
		 
		cmd += " | wc -l | tr -d ' '";

		exec(cmd, function (error, stdout) {
			// get rid of newlines in data
			var data = stdout.slice(0, stdout.length-1);
			responseData += data+"]";

			// wrap data with wrapWithCallback if there is a callback parameter...
			if (params.query.hasOwnProperty('callback') === true && typeof params.query.callback === 'string' ) {
				responseData = wrapWithCallback (responseData, params.query.callback);
			}	
			response.end( responseData );
		});
}


/**
	This function takes parameters like filter to 'grep filter'
	and nolines to 'tail -nolines'...
*/
function get (request, response, filename) {
	var params = require('url').parse(request.url, true),
		spawn = require('child_process').spawn,
		tail,
		nolines = "-100",
		responseData="[";
		
	global.log ('in get, pathname= ' + params.pathname);
    response.writeHead(200, {'Content-Type': 'application/json'});
	
	if (params.query.hasOwnProperty('nolines') === true && typeof params.query.nolines === 'string' ) {
		nolines="-"+params.query.nolines;
	}

	tail 	= spawn('tail', [nolines, filename]);
	
	tail.stdout.on ('data', function (data) {
	  	global.log('in get, tail stdout: + data.len=' + data.length);
        responseData += String(data).replace(/\n/g, ',\n');		// replace newlines by ',\n'
	});
	
	tail.stderr.on('data', function (data) {
	  	global.log('tail stderr: ' + data);
	});

	// the raspberry likes close here instead of exit...
	//	tail.on('close', function (code) {
	var exitEventString = (process.platform == 'darwin')  ? "exit" : "close";

	tail.on(exitEventString, function (code) {
		responseData = responseData.replace(/,\n$/, '');		// removed the last ,
		responseData += "]";

		// wrap data with wrapWithCallback if there is a callback parameter...
		if (params.query.hasOwnProperty('callback') === true 
			&& typeof params.query.callback === 'string' ) {
			responseData = wrapWithCallback (responseData, params.query.callback);
		}		

	  	global.log('child process exited with code ' + code + "\nresponseData: + responseData");
      	response.end(responseData);	
	});	
}


/**
	wrap the data with a callback
 */
function wrapWithCallback (data, callback) {
	return callback + "("+data+")";
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

