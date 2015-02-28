#!/usr/bin/env node
/*jslint node: true */
/*
	Johannes Mainusch
	Start: 2014-12-21
*/
module.exports = DataBase;

var	global 	= global || require ("../../main/global/global.js").init("from DataBase");
var Lines2JSON  = require ("./Lines2JSON.js");
var XRef  		= require ("./XRef.js");
var stream 		= require('stream');
var util 		= require('util');
var Transform 	= stream.Transform;

// the webServer Object
function DataBase() {
  	// allow use without new
  	if (!(this instanceof DataBase)) {
  		global.log ("in DataBase: !(this instanceof DataBase, returning new DataBase...");
    	return new DataBase();
  	}
//  	DataBase.call(this);
	this.self = this;
  	this.getDataCB = 	function (noLines, filter, callback) {return getDataCB(noLines, filter, callback)};
	this.getNoLines = function (filter,callback) {return getNoLines(filter,callback)};
	this.getFirst = 	function (callback) {return getFirst(callback)};
	this.getLast =   	function (callback) {return getLast(callback)};
	this.getNoLines = function (filter,callback) {return getNoLines(filter,callback)};
	this.dataFileName = function () {return global.datafilename};
	this.getXref = 	function (noLines, column, callback) {return getXref(noLines, column, callback)};
	this.writeData = function (message, callback) {return writeData(message, callback)};
	this.writePartial = function (message, callback) {return writePartial (message, callback)};
	this.execInShell = function (cmd, callback) {return execInShell (cmd, callback)};
	this.removeDB = function() {return removeDB()};
	this.setObjectID = function(x) {this.ObjectID=x; return this;};
	this.logObjectID = function() { global.log ("dataBase.ObjectID=" + this.ObjectID); return this;};
	this.setObjectID.call (this, Math.random());
	this.logObjectID();
	return this;
};

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
	var spawn 	= require('child_process').spawn,
		cat 	= spawn("cat", [global.datafilename]),
		grep 	= spawn("grep", [filter]),
		wc	 	= spawn("wc", ['-l']),
		tr	 	= spawn("tr", ['-d',' ']),
		lines2JSON = new Lines2JSON,
		stream 	= new Transform;

	cat.stdout.pipe(grep.stdin);
	grep.stdout.pipe(wc.stdin);
	wc.stdout.pipe(tr.stdin);
	tr.stdout
		.pipe(lines2JSON)
		.pipe(stream);
	return stream;
}

/**
	getData() will return Data as array of data objects
	filter: a filter string to grep for
	noLines: the number of lines to tail the data...
	callback: the callback
*/
DataBase.prototype.getData = function (noLines, filter) {
	var spawn 	= require('child_process').spawn,
		tail 	= spawn("tail", [-noLines, global.datafilename]),
		grep 	= spawn("grep", [filter]),
		lines2JSON = new Lines2JSON,
		stream 	= new Transform;
	global.log ('in getData('+noLines+', "'+filter+'" )');

	tail.stdout
		.pipe(grep.stdin);

	grep.stdout
		.pipe(lines2JSON)
		.pipe(stream);

	return stream;  // this is needed for chaining like in streams
}


/**
 * tailDB implements a tail stream on the DB that returns only full lines,
 * even if data is only partially written to the DB
 */
DataBase.prototype.tailDB = function () {
	var tail 	= require('child_process')
					.spawn("tail", [ '-fn', '1', global.datafilename]),
		stream 	= new Transform;
	tail.stdout
		.pipe(stream);
 	return stream;
}


/**
	getFirst gets the first data entry
*/
function getFirst (callback) {
	return execInShell ('head -1 ', callback);
}

/**
	getLAst gets the first data entry
*/
function getLast (callback) {
	var res = execInShell ('tail -1 ');
	if (typeof callback === 'function' ) callback();
	return res;
}

/**
	execInShell will do a 'cat' on filename and pipe the results on 'cmd'
	and do a tail - noLines on ot at the end...
*/
function execInShell (cmd, callback) {
	var exec = require('child_process').exec,
		self = this,
		data,
		stream = new Transform;

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
			stream.push(data);
	});
	return stream;  // this is neede for chaining like in streams
}


/**
	getXref (noLines, column, callback) return the cross reference, i.e. all different values in column
 */
function getXref (noLines, column) {
	var self = this,
		spawn = require('child_process').spawn,
		tail = spawn("tail", [-noLines, global.datafilename]),
		xRef = new XRef(column),
		stream = new Transform;
	global.log ("in getXref, column="+column);
	tail.stdout
		.pipe(xRef)
		.pipe(stream);
	return stream;
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
