#!/usr/bin/env node
/*jslint node: true */
/*
	Johannes Mainusch
	Start: 2014-12-21
*/
module.exports = DataBase;

var	global 	= global || require ("../../main/global/global.js").init("from DataBase");
var Lines2JSON  = require ("./Lines2JSON.js");
var stream 		= require('stream');
var util 		= require('util');
var Transform 	= stream.Transform;

// the webServer Object
function DataBase(options) {
  	// allow use without new
  	if (!(this instanceof DataBase)) {
  		global.log ("in DataBase: !(this instanceof DataBase, returning new DataBase...");
    	return new DataBase(options);
  	}
  	this.getData = 	function (noLines, filter) {return getData(noLines, filter)};
  	this.getDataCB = 	function (noLines, filter, callback) {return getDataCB(noLines, filter, callback)};
	this.getNoLines = function (filter,callback) {return getNoLines(filter,callback)};
	this.getFirst = 	function (callback) {return getFirst(callback)};
	this.getLast =   	function (callback) {return getLast(callback)};
	this.getNoLines = function (filter,callback) {return getNoLines(filter,callback)};
	this.dataFileName = function () {return global.datafilename};
	this.getXref = 	function (noLines, column, callback) {return getXref(noLines, column, callback)};
	this.tailDB = function (callback) {return tailDB (callback)};
	this.tail = new Transform;
	this.writeData = function (message, callback) {return writeData(message, callback)};
	this.writePartial = function (message, callback) {return writePartial (message, callback)};
	this.execInShell = function (cmd, callback) {return execInShell (cmd, callback)};
	this.removeDB = function() {return removeDB()};
	this.setObjectID = function() {this.ObjectID=Math.random(); return this;};
	this.ObjectID;
	this.lines2JSON = new Lines2JSON;
	this.stream = new Transform;
	return this;
};

var dataBase = new DataBase().setObjectID();

Transform.prototype._transform = function (chunk, encoding, done) {
	this.push (chunk);
	done();
}


/**
	getnoLines will return the number of lines in the file
	filter: a filter string to grep for
	callback: the callback
*/
function getNoLines (filter, callback) {
	global.log ('in getNoLines...'  );
	var cmd = "cat " + global.datafilename,
		exec = require('child_process').exec;

	this.stream = this.stream || new Transform;

	if (typeof filter === 'string' )
		cmd += " | grep '"+filter+"'";

	cmd += " | wc -l | tr -d ' '";

	exec(cmd, function (error, stdout) {
		// get rid of newlines in data and add "[]" brackets
		var data = "["+stdout.slice(0, stdout.length-1).concat("]");
		global.log ('    getNoLines, cmd='+cmd);
		global.log ('    getNoLines, data='+data);
		if (typeof callback === 'function' ) {
			global.log ("in getNoLines, data = "+ data);
			callback(data);
		}
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
function getData (noLines, filter) {
	var spawn = require('child_process').spawn,
		tail = spawn("tail", [-noLines, global.datafilename]),
		grep = spawn("grep", [filter]);
	global.log ('in getData('+noLines+', "'+filter+'" )');

	tail.stdout
		.pipe(grep.stdin);
	grep.stdout
		.pipe(dataBase.lines2JSON)
		.pipe(dataBase.stream);

	return dataBase;  // this is neede for chaining like in streams
}


/**
	getData() will return Data as array of data objects
	filter: a filter string to grep for
	noLines: the number of lines to tail the data...
	callback: the callback
*/
function getDataCB (noLines, filter, callback) {
	var spawn = require('child_process').spawn,
		tail = spawn("tail", [-noLines, global.datafilename]),
		grep = spawn("grep", [filter]),
		responseData="[",
		self = this;
	global.log ('in getDataCB('+noLines+', "'+filter+'", "callback" )');

	tail.stdout
		.pipe(grep.stdin);

	grep.stdout.on ('data', function (data) {
    	responseData += String(data).replace(/\n/g, ',\n');		// replace newlines by ',\n'
// 		global.log ("dataBase:getData grep.stdout..., responseData.length="+responseData.length);
	})

	grep.stderr.on ('data', function (data) {
		console.log('grep stderr: ' + data);
	})

	grep.on ('close', function (code) {
		if (code !== 0) {
    		console.log('grep process exited with code ' + code);
  		}
  		responseData = responseData.replace(/,\n$/, '');		// removed the last ,
		responseData += "]";
//	  	global.log('dataBase:getData, exit with responseData ' + code + "\n    responseData=" + responseData+'...');
		callback(responseData);
	})

	return this;  // this is neede for chaining like in streams
}

/**
	getFirst gets the first data entry
*/
function getFirst (callback) {
	execInShell ('head -1 ', callback);
	return this;
}

/**
	getLAst gets the first data entry
*/
function getLast (callback) {
	execInShell ('tail -1 ', callback);
	return this;
}

/**
	execInShell will do a 'cat' on filename and pipe the results on 'cmd'
	and do a tail - noLines on ot at the end...
*/
function execInShell (cmd, callback) {
	var exec = require('child_process').exec,
		self = this,
		data;

	this.stream = new Transform;

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
 function tailDB (callback) {
	var self = this,
		buffer = "",
		data;

	this.kill = function () { global.log ("tailDB.kill: "+self); self.tail.kill("SIGHUP") };

	this.tail = this.tail ||
		new require('child_process').spawn("tail", [ '-fn', '1', global.datafilename]);

	this.tail.stdout
		.pipe(dataBase.tail);

	// this should kill the hanging tail process
	process.on ('exit', function () {
		self.tail.kill("SIGHUP");
	});

	if (typeof callback === 'function' ) callback();

 	return dataBase;
 }

/**
	getXref (noLines, column, callback) return the cross reference, i.e. all different values in column
 */
function getXref (noLines, column, callback) {
	var self = this,
		spawn = require('child_process').spawn,
		tail = spawn("tail", [-noLines, global.datafilename]);
	global.log ("in getXref, column="+column);

	this.stream = new Transform;

/*	dataBase.getData (noLines, '')
		.stream
		.on ('data', function (data) {
			// continue to exchange callback versus stream here...
*/
		getDataCB (noLines, '', function (data) {
		// now find the uniques in the data 'column'
		var unique 	 = {},
			distinct = [];

		global.log ('dataBase:getXref, getData callback');
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

// initiallize the database
function removeDB (callback) {
	var	fs = require('fs');
	fs.unlinkSync(global.datafilename);
	execInShell ("killall tail", callback);
	return this;
}
