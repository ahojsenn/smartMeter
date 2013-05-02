#!/usr/bin/env node
/*jslint node: true */
/*
	Johannes Mainusch
	Start: 2013-03-02
	Idea: 
	The server serves data in json format from files
	The Data is in the file 'datafilename'	
*/

var Common = require('./common.js');

main ();

function main () {
	Common.logdebug ('interpreting the command line args...' + process.argv.length);

	// in dev mode I will start a process that fills the data file in two seconds intervall to test the Web-Socket...
	function devServerMeterSimulation () {
		// set timer intervall
		var exec = require('child_process').exec;

		// create an entry in the datafile at random time between 0-10s intervalls
		this.createRandomData = function  () {
			var randomTime = Math.round(2000*Math.random()); // something between 0 and 10 seconds
			var objref = this;

			setTimeout(function () {
				var watt=86400/(75*randomTime/1000),
					cmd = "echo {'\"'test1'\"' : '\"'huhuh'\"', '\"'Watt'\"' : "+watt+", '\"'timestamp'\"': `date +%s000`} >> /Volumes/docdata/johannes.mainusch/docjoe/development/meter_eenergy/data/testData.json";
				Common.logdebug('createRandomData created 1/75 KW/h after '+ randomTime/1000 + 's. Watt= ' + watt);
				exec (cmd);
				objref.createRandomData();
			}, randomTime);
		};
	}
	
	// in dev mode I will start a process that fills the data file in two seconds intervall to test the Web-Socket...
	if (Common.mode == 'dev') {
		Common.logdebug('DEV MODE');
		Common.datafilename = '/Volumes/docdata/johannes.mainusch/docjoe/development/smartMeter/data/testData.json';
		Common.exitEventString = 'exit';	
		var myDevServerMeterSimulation = new devServerMeterSimulation ();
		myDevServerMeterSimulation.createRandomData();
	}

	// parse the argv arrqy...
	process.argv.forEach(function(val, index, array) {
	 	var serverport=8127,
			stringIndex=val.indexOf("serverport=");

		if (stringIndex >= 0) serverport=val.split("=")[1];

		// whenever the last array member is parsed, start the server...
		if (index == process.argv.length-1) 
			server (serverport);	
	});	
}


/**
	the http server
*/ 
function server(port) {
	var app = require('http').createServer(function (request, response) {
  		response.writeHead(200, {'Content-Type':'text/plain'});
  		server_response (request, response);
		//  response.end( server_response (request) );
	}).listen(port,  '::');
	
	Common.logdebug('Server is running at http://127.0.0.1:'+port);

	// start a Web-Socket
	var webSocket = new myWebSocket ();
	webSocket
		.startSocket (app)
		.startDataListener (Common.datafilename);

	// start a Web-Socket
/*	var webSocket6 = new myWebSocket ();
	webSocket6
		.startSocket (app6)
		.startDataListener (Common.datafilename);
*/
}


/** 
	parse the request and construct the server response
*/
function server_response (request, response) {
	Common.logdebug ('in server_response, request: ' + request.url);
	var url='/smartMeter',
		params = require('url').parse(request.url, true);
	
	// parse the request
	Common.logdebug ('in server_response, pathname: ' + params.pathname + !(params.pathname.indexOf('.css')==-1) );
	if (params.pathname == url+'/get') get (request, response, Common.datafilename);		
	if (params.pathname == url+'/getnolines') getnolines (request, response, Common.datafilename);		
	if (params.pathname == url+'/getfirst') executethis (request, response, Common.datafilename, 'head -1 ');		
	if (params.pathname == url+'/getlast') executethis (request, response, Common.datafilename, 'tail -1 ');		
	if ( (params.pathname.indexOf(url+'/client/') == 0 ) ){
		var myfilename = params.pathname.substring (params.pathname.lastIndexOf('/')+1);
		var myMimeType = "text/plain",
			myFileending = params.pathname.substring (params.pathname.lastIndexOf('.')+1);
		
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
		
		Common.logdebug ('serving static file: ' + myfilename + "myFileending:" + myFileending + "  mimeType: " + myMimeType);
		
		var fs = require('fs');
		fs.readFile('./client/' + myfilename, "binary", function (err, file) {
			Common.logdebug ('readFile: ' + './client/' + myfilename);
			
		            if (err) {
						Common.logdebug ('ERROR readFile: ' + './client/' + myfilename);
		                response.writeHead(500, {"Content-Type": "text/plain"});
		                response.write(err + "\n");
		                response.end();
		                return;
		            }
					
					Common.logdebug ('response.write: ' + './client/' + myfilename);
		            response.writeHead(200, {"Content-Type": myMimeType});
		            response.write(file, "binary");
		            response.end();	
					Common.logdebug ('response.end: ' + './client/' + myfilename);
			}
		);
	}
}

/**
	getfiost will return the first entry
*/
function executethis (request, response, filename, cmd) {
	Common.logdebug ('in executethis');	
	var params = require('url').parse(request.url, true),
		exec = require('child_process').exec,
		data;

	if (params.query.hasOwnProperty('filter') === true && typeof params.query.filter === 'string' ) 
		cmd = 'cat ' + filename + ' | grep ' + params.query.filter + " | " + cmd;
	else
		cmd = cmd + filename;
			
	exec(cmd, function (error, data) {
		Common.logdebug('callback in executethis, cmd: ' + cmd + "\n" +data);
		response.end( jsonresponse (data, params) );
	});
}

/**
	getnolines will return the number of lines in the file
*/
function getnolines (request, response, filename) {
	Common.logdebug ('in getnolines');	
	var params = require('url').parse(request.url, true),
		cmd = "cat " + filename,
		exec = require('child_process').exec,
		responseData=params.query.callback+"([";
		

		if (params.query.hasOwnProperty('filter') === true && typeof params.query.filter === 'string' ) 
			cmd += ' | grep ' + params.query.filter;
		 
		cmd += " | wc -l | awk '{print $1}'";

		exec(cmd, function (error, data) {
			Common.logdebug('callback in getnolines, cmd: ' + cmd + "\n" +data);
			responseData += data+"])";
			response.end( responseData );
		});
}


/**
   	read and return the tweets from ./gotTweets.json
   	and return as jsonp
	This function takes parameters like filter to 'grep filter'
	and nolines to 'tail -nolines'...
*/
function get (request, response, filename) {
	var params = require('url').parse(request.url, true),
		spawn = require('child_process').spawn,
		tail,
		nolines = "-10",
		responseData=params.query.callback+"([";
		
	Common.logdebug ('in get, pathname= ' + params.pathname);
    response.writeHead(200, {'Content-Type': 'application/json'});
	
	if (params.query.hasOwnProperty('nolines') === true && typeof params.query.nolines === 'string' ) {
		nolines="-"+params.query.nolines;
	}
	tail 	= spawn('tail', [nolines, filename]);
	
	tail.stdout.on ('data', function (data) {
	  	console.log('in get, tail stdout: + data.len=' + data.length);
        responseData += String(data).replace(/\n/g, ',\n');		// replace newlines by ',\n'
	});
	
	tail.stderr.on('data', function (data) {
	  	console.log('tail stderr: ' + data);
	});

	// the raspberry likes close here instead of exit...
	//	tail.on('close', function (code) {
	tail.on(Common.exitEventString, function (code) {
		responseData = responseData.replace(/,\n$/, '\n');		// removed the last ,
        responseData += "])";
	  	console.log('child process exited with code ' + code + "\nresponseData: + responseData");
      	response.end(responseData);	
	});	
}


/**
   	start a Web-Socket that will deliver data on every new entry of the datafile
	last refactored: 20130411, JM
*/
function myWebSocket () {
	
	console.log('in webSocket');
	var objref = this;	
	
	this.setSocket = function (socket) { this.socket = socket; return this; };

	this.startDataListener = function (filename) {
		Common.logdebug ('started dataListener on file: '+ filename);
		var tail  = require('child_process')
			.spawn('tail', ['-f', '-n1', filename])
			.stdout.on ('data', 
				function (data) {
		  			console.log('in dataListener, data: '+  data );
					if ( (typeof objref.socket === 'object') ) {
						console.log('objref.socket.emit (news, data):' + data);
						// Trigger the web socket now
						objref.socket.emit ('got new data', JSON.parse (data) );
					}
				});
		return this;
	};
		
	this.startSocket = function (app) {
		var io = require('socket.io').listen(app)
			.sockets.on('connection', function (socket) {
				objref.setSocket (socket);
			});
		return this;
	};
		
	return this;
}

