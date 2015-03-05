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
var Readable 	= stream.Readable;
var fs 			= require('fs');

// the webServer Object
function DataBase() {
  	// allow use without new
  	if (!(this instanceof DataBase)) {
  		global.log ("in DataBase: !(this instanceof DataBase, returning new DataBase...");
    	return new DataBase();
  	}
	this.dataFileName = function () {return global.datafilename};
	this.setObjectID = function(x) {this.ObjectID=x; return this;};
	this.logObjectID = function() { global.log ("dataBase.ObjectID=" + this.ObjectID); return this;};
	this.setObjectID.call (this, Math.random());
	this.logObjectID();
};

Transform.prototype._transform = function (chunk, encoding, done) {
	this.push (chunk);
	done();
}




/**
	getnoLines will return the number of lines in the file
	filter: a filter string to grep for
*/
DataBase.prototype.getNoLines = function (filter) {
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
*/
DataBase.prototype.getData = function (noLines, filter) {
	var spawn 	= require('child_process').spawn,
		tail 	= spawn("tail", [-noLines, global.datafilename]),
		grep 	= spawn("grep", [filter]),
		lines2JSON = new Lines2JSON,
		stream 	= new Transform;
	global.log ("in dataBase.getData..." + noLines + " " + filter);
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
DataBase.prototype.getFirst = function() {
	var head 	= require('child_process').spawn("head", ['-1', global.datafilename]),
		stream 	= new Transform;
		l2JSON  = new Lines2JSON,
	head.stdout
		.pipe(l2JSON)
		.pipe(stream);
 	return stream;
}

/**
	getLAst gets the first data entry
*/
DataBase.prototype.getLast = function  () {
	var tail 	= require('child_process').spawn("tail", ['-1', global.datafilename]),
		stream 	= new Transform;
		l2JSON  = new Lines2JSON,
	tail.stdout
		.pipe(l2JSON)
		.pipe(stream);
 	return stream;
}


/**
	getXref (noLines, column) return the cross reference, i.e. all different values in column
	{"term": "Erdgas"; "Watt": 36.7; "Timestamp" : 1241231234123}
	{"term": "Strom"; "Watt": 36.7; "Timestamp" : 1241231234123}
 */
DataBase.prototype.getXref = function (noLines, column) {
	var self = this,
		spawn = require('child_process').spawn,
		tail = spawn("tail", [-noLines, global.datafilename]),
		xRef = new XRef(column),
		stream = new Transform;
	tail.stdout
		.pipe(xRef)
		.pipe(stream);
	return stream;
}

/**
	append the Database
 */
DataBase.prototype.appendDB = function () {
	return fs.createWriteStream(global.datafilename, {'flags': 'a'});
}

/**
	stream the globals
 */
DataBase.prototype.getGlobals = function () {
	var s = new stream.Readable();
	s._read = function noop() {}; // redundant? see update below
	s.push(JSON.stringify(global));
	s.push(null);
	return s;
}


/**
	take a sting an stream it...
 */
DataBase.prototype.streamString = function (string) {
	var s = new stream.Readable();
	s._read = function noop() {}; // redundant? see update below
	s.push(string);
	s.push(null);
	return s;
}

// initiallize the database
DataBase.prototype.removeDB = function() {
	var	fs 			= require('fs');
	var killAll 	= require('child_process').spawn("killall", ['tail']);
	fs.unlinkSync(global.datafilename);
	killAll;
	return this;
}
