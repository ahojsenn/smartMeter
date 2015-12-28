#!/usr/bin/env node
/*jslint node: true */
/*
	Johannes Mainusch
	Start: 2014-12-21
*/
module.exports = DataBase;

var	global 	= global || require ("../../main/global/global.js").init("from DataBase");
var Lines2JSON  = require ("./Lines2JSON.js");
var Lines2JSONAtoms  = require ("./Lines2JSONAtoms.js");
var XRef  		= require ("./XRef.js");
var stream 		= require('stream');
var util 		= require('util');
var Transform 	= stream.Transform;
var Readable 	= stream.Readable;
var fs 			= require('fs');

// the DataBase Object
function DataBase(options) {
  	// allow use without new
  	if (!(this instanceof DataBase)) {
  		global.log ("in DataBase: !(this instanceof DataBase, returning new DataBase...");
    	return new DataBase(options);
  	}
  	if (options && options.dataFileName)
		this.dataFileName = options.dataFileName;
	else
		this.dataFileName = global.datafilename;
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
		cat 	= spawn("cat", [this.dataFileName]),
		grep 	= spawn("grep", [filter]),
		wc	 	= spawn("wc", ['-l']),
		tr	 	= spawn("tr", ['-d',' ']),
		lines2JSON = new Lines2JSON;

	cat.stdout.pipe(grep.stdin);
	grep.stdout.pipe(wc.stdin);
	wc.stdout.pipe(tr.stdin);
	return tr.stdout.pipe(lines2JSON)
}

/**
	getDataAtoms() will return Data as stream of json objects
*/
DataBase.prototype.getDataAtoms = function (noLines, filter) {
	var noLines = (typeof noLines === 'undefined') ? 1000 : noLines,
		filter  = (typeof filter === 'undefined') ? '' : filter,
		spawn 	= require('child_process').spawn,
		tail 	= spawn("tail", [-noLines, this.dataFileName]),
		grep 	= spawn("grep", [filter]),
		lines2JSONAtoms = new Lines2JSONAtoms;
	tail.stdout
		.pipe(grep.stdin);
	return grep.stdout.pipe(lines2JSONAtoms);
}

/**
	getData() will return Data as array of data objects
	filter: a filter string to grep for
	noLines: the number of lines to tail the data...
*/
DataBase.prototype.getData = function (noLines, filter) {
	var noLines = (typeof noLines === 'undefined') ? 1000 : noLines,
		filter  = (typeof filter === 'undefined') ? '' : filter,
		spawn 	= require('child_process').spawn,
		tail 	= spawn("tail", [-noLines, this.dataFileName]),
		grep 	= spawn("grep", [filter]),
		lines2JSON = new Lines2JSON;
	tail.stdout
		.pipe(grep.stdin);
	return grep.stdout.pipe(lines2JSON);
}


/**
 * tailDB implements a tail stream on the DB that returns only full lines,
 * even if data is only partially written to the DB
 */
DataBase.prototype.tailDB = function () {
	var tail 	= require('child_process')
					.spawn("tail", [ '-fn', '1', this.dataFileName]);
	return tail.stdout;
}


/**
	getFirst gets the first data entry
*/
DataBase.prototype.getFirst = function() {
	var head 	= require('child_process').spawn("head", ['-1', this.dataFileName]),
		l2JSON  = new Lines2JSON;
	return head.stdout.pipe(l2JSON)
}

/**
	getLAst gets the first data entry
*/
DataBase.prototype.getLast = function  () {
	var tail 	= require('child_process').spawn("tail", ['-1', this.dataFileName]),
		l2JSON  = new Lines2JSON;
	return tail.stdout.pipe(l2JSON);
}


/**
	getXref (noLines, column) return the cross reference, i.e. all different values in column
	{"term": "Erdgas"; "Watt": 36.7; "Timestamp" : 1241231234123}
	{"term": "Strom"; "Watt": 36.7; "Timestamp" : 1241231234123}
 */
DataBase.prototype.getXref = function (noLines, column) {
	var spawn = require('child_process').spawn,
		tail = spawn("tail", [-noLines, this.dataFileName]),
		xRef = new XRef(column);
	return tail.stdout.pipe(xRef);
}

/**
	append the Database
 */
DataBase.prototype.appendDB = function () {
	return fs.createWriteStream(this.dataFileName, {'flags': 'a'});
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
	s._read = function noop() {}; // redundant? see update below, I think this is here to cope for older node versions...
	s.push(string);
	s.push(null);
	return s;
}

// initiallize the database
DataBase.prototype.removeDB = function(cb) {
	var	fs 			= require('fs'),
		killAll 	= require('child_process').spawn("killall", ['tail']),
		self 		= this;
	fs.exists( this.dataFileName, function (exists) {
  		if (exists) fs.unlinkSync(self.dataFileName);
		if (cb) cb();
		});
	killAll;
	return this;
}

// get all the data of one day
DataBase.prototype.getDaysData = function (timestamp) {
	// use sed -n '/1419980400000/,/1420066800000/p' /tmp/data/test.json
 	var date 		= new Date (timestamp),
 		startOfDay 	= Date.parse( new Date (date.getFullYear(), date.getMonth(), date.getDate() )),
		endOfDay 	= Date.parse( new Date (date.getFullYear(), date.getMonth(), date.getDate() +1)),
 		spawn 		= require('child_process').spawn,
		sed 		= spawn('sed', ['-n', "'/"+startOfDay+"/,/"+endOfDay+"/p'",this.dataFileName]);
	return sed.stdout;
}
