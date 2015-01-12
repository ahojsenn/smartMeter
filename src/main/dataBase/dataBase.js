#!/usr/bin/env node
/*jslint node: true */
/*
	Johannes Mainusch
	Start: 2014-12-21
*/
module.exports = DataBase;

var stream 		= require('stream');
var util 		= require('util');
var Readable 	= require('stream').Readable;
Readable.prototype._read = function () {}

var	global 	= global || require ("../../main/global/global.js").init("from DataBase");

// the webServer Object
function DataBase(options) {
  	// allow use without new
  	if (!(this instanceof DataBase)) {
  		global.log ("in DataBase: !(this instanceof DataBase, returning new DataBase...");
    	return new DataBase(options);
  	}
  	this.getData = 	function (noLines, filter, callback) {return getData(noLines, filter, callback)};
	this.getNoLines = function (filter,callback) {return getNoLines(filter,callback)};
	this.getFirst = 	function (callback) {return getFirst(callback)};
	this.getLast =   	function (callback) {return getLast(callback)};
	this.getNoLines = function (filter,callback) {return getNoLines(filter,callback)};
	this.dataFileName = function () {return global.datafilename};
	this.getXref = 	function (noLines, column, callback) {return getXref(noLines, column, callback)};
	this.tailDB = function () {return tailDB ()};
	this.writeData = function (message, callback) {return writeData(message, callback)};
	this.writePartial = function (message, callback) {return writePartial (message, callback)};
	this.execInShell = function (cmd, callback) {return execInShell (cmd, callback)};
	this.ObjectID = function() {return Math.random();}
	return this;
};


/**
	getnoLines will return the number of lines in the file
	filter: a filter string to grep for
	callback: the callback
*/
function getNoLines (filter, callback) {
	global.log ('in getNoLines...'  );
	var cmd = "cat " + global.datafilename,
		exec = require('child_process').exec;

	this.stream = new Readable;

	if (typeof filter === 'string' )
		cmd += " | grep '"+filter+"'";

	cmd += " | wc -l | tr -d ' '";

	exec(cmd, function (error, stdout) {
		// get rid of newlines in data and add "[]" brackets
		var data = "["+stdout.slice(0, stdout.length-1).concat("]");
		global.log ('    getNoLines, cmd='+cmd);
		global.log ('    getNoLines, data='+data);
		if (typeof callback === 'function' )
			callback(data);
		else {
			global.log("in getNoLines... no callback provided");
			global.log("pushed data");
			this.stream.push(data);
		}
	})
	return this;  // this is neede for chaining like in streams
}

/**
	getData() will return Data as array of data objects
	filter: a filter string to grep for
	noLines: the number of lines to tail the data...
	callback: the callback
*/
function getData (noLines, filter, callback) {
	var spawn = require('child_process').spawn,
		tail = spawn("tail", [-noLines, global.datafilename]),
		grep = spawn("grep", [filter]),
		responseData="[",
		self = this;
	global.log ('in getData('+noLines+', "'+filter+'", callback() )');

	this.stream = new Readable;
	tail.stdout.pipe(grep.stdin);

	grep.stdout.once ('data', function (data) {
 		global.log ("dataBase:getData grep.stdout, data="+ data);
    	responseData += String(data).replace(/\n/g, ',\n');		// replace newlines by ',\n'
	})

	grep.stderr.once ('data', function (data) {
		console.log('grep stderr: ' + data);
	})

	grep.once ('close', function (code) {
		if (code !== 0) {
    		console.log('grep process exited with code ' + code);
  		}
  		responseData = responseData.replace(/,\n$/, '');		// removed the last ,
		responseData += "]";
	  	global.log('dataBase:getData, exit with code ' + code + "\n    responseData:" + responseData+'...');
		if (typeof callback === 'function' )
			callback(responseData);
		else
			self.stream.push(responseData);
	})
	return this;  // this is neede for chaining like in streams
}

/**
	getFirst gets the first data entry
*/
function getFirst (callback) {
	execInShell ('head -1 ', callback);
	return this;  // this is neede for chaining like in streams
}

/**
	getLAst gets the first data entry
*/
function getLast (callback) {
	this.stream = new Readable;

	execInShell ('tail -1 ', callback);

	return this;  // this is neede for chaining like in streams
}

/**
	execInShell will do a 'cat' on filename and pipe the results on 'cmd'
	and do a tail - noLines on ot at the end...
*/
function execInShell (cmd, callback) {
	var exec = require('child_process').exec,
		self = this,
		data;

	this.stream = new Readable;

	cmd += " " + global.datafilename;
	global.log ('in execInShell, cmd='+cmd);

	exec(cmd, function (error, data) {
		data = data.replace(/\r?\n|\r/g, ","); // trade newlines to ","
		data = "["+data+"]";					// add [] for array
		data = data.replace(/},]/, '}]');		// removed the last ","
		global.log('callback in execInShell, cmd: ' + cmd + "\n" +data);
		if (typeof callback === 'function' )
			callback(data);
		else
			self.stream.push(data);
	});
	return this;  // this is neede for chaining like in streams
}

/**
 * tailDB implements a tail stream on the DB that returns only full lines,
 * even if data is only partially written to the DB
 */
 function tailDB () {
	var tail = require('child_process').spawn("tail", [ '-n1', '-f', global.datafilename]),
		self = this,
		buffer = "",
		data;

	this.stream = this.stream || new Readable;

	tail.stdout.on ('data', function (data) {
 		global.log ("dataBase:tailDB, tail.stdout, data="+ data);
 		buffer += data;
 		// split data in lines by \n
 		// push every complete line
 		// remove what was pushed from the buffer
 		// and buffer the rest, i.e. set data to the rest
 		var lineArray = buffer.toString('utf8')
 							.split("\n");
// 							.split(/\r\n|[\n\r\u0085\u2028\u2029]/g);
		//put \n back on the end of each line, except the last...
		for (var i=0; i < lineArray.length-1; i++ ) {
	 		lineArray[i] += "\n";
			global.log ("         ..., found line="+lineArray[i]+"..."+i+" "+lineArray.length);
	 	}
	 	// now loop through all the lines and push every line with \n at the end
	 	for (var i=0; i < lineArray.length; i++ ) {
	 		var line = lineArray[i];
			global.log ("dataBase:tailDB, found line="+line+"..."+lineArray.length);
			if (line.indexOf('\n') >0) {
				global.log ("dataBase:tailDB, pushing line"+line);
				self.stream.push(line);
			}
			else {
				global.log ("dataBase:tailDB, setting data to the uncomplete rest, line="+line);
				buffer = line;
			}
		}
	});

 	return this;
 }

/**
	getXref (noLines, column, callback) return the cross reference, i.e. all different values in column
 */
function getXref (noLines, column, callback) {
	var self = this;
	global.log ("in getXref, column="+column);
	this.stream = new Readable;

	getData (noLines, '', function (data) {
		// now find the uniques in the data 'column'
		var unique 	 = {},
			distinct = [];

		data=JSON.parse(data);
		for (var line in data){
			if ( !(data[line][column] in unique) ) {
				global.log ("dataBase:getXref, found unique "+data[line][column]);
				unique[data[line][column]] = true;
				distinct.push (data[line][column]);
			}
		}
		global.log ("dataBase:getXref, returning JSON.stringify(unique)="+JSON.stringify(distinct)) ;
		if (typeof callback === 'function' )
			callback(JSON.stringify(distinct));
		else
			self.stream.push(JSON.stringify(distinct));
	});
	return this;  // this is neede for chaining like in streams
}


function writeData (message, callback) {
	var	fs = require('fs');

	//Now make sure, the values are logged somewhere, namely in logFile...
	fs.appendFile (global.datafilename,  message +'\n', function(err) {
	    if(err) {
	        console.log(err);
	    } else {
	        global.log('dataBase:writeData, '+global.datafilename + " was appended: " + message);
		}
	});

	if (typeof callback === 'function')
		callback ();
	return this;  // this is needed for chaining like in streams
}

// like writeData with no newline
function writePartial (message, callback) {
	var	fs = require('fs'),
	 self = this;

	//Now make sure, the values are logged somewhere, namely in logFile...
	fs.appendFile (global.datafilename,  message, function(err) {
	    if(err) {
	        console.log(err);
	    } else {
	        global.log("dataBase:writePartial,"+global.datafilename + " was appended with partial: " + message);
		}
	});

	if (typeof callback === 'function') {
		callback ();
	}
	return self;  // this is needed for chaining like in streams
}

