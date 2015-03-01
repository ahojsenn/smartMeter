#!/usr/bin/env node
/*jslint node: true */
/*
	Johannes Mainusch
	Start: 20150213
*/
module.exports = XRef;
var util 		= require('util');
var stream 		= require('stream');
var Transform 	= stream.Transform;
var	global 	= global || require ("../../main/global/global.js").init("from DataBase");

function XRef (filter, options) {
	// allow use without new
  	if (!(this instanceof XRef)) {return new XRef(filter, options); }
 	//
  	// init Transform
	 if (!options) options = {}; // ensure object
  	options.objectMode = true; // forcing object mode
  	Transform.call(this, options);
	this._lastline = "";
	this._first = true;
	this.filter = filter;
	this.xref = [];  // the array with the xrefs
}
util.inherits(XRef, Transform);



XRef.prototype._transform = function (chunk, encoding, done) {
	var lines = chunk.toString().split("\n"),
		self = this,
		data = "";
	//
	for (var i=0; i< lines.length-1; i++) {
		var line = lines[i];
		if (i==0) { line = this._lastline + line; }
		line = JSON.parse(line);
		// the first time ever called
		if (this._first) {
			this._first = false;
			if ( this.xref.indexOf(line[this.filter]) == -1 ) {
				data += '["'+line[this.filter]+'"';
				this.xref.push (line[this.filter]);
			}
		}
		// the first time called this time round
   		else if (i==0) {
   			if ( this.xref.indexOf(line[this.filter]) == -1 ) {
				line = this._lastline+line;
				data += ',"'+line[this.filter]+'"';
				this.xref.push (line[this.filter]);
			}
		}
		// the second, third, ...
   		else {
   			if ( this.xref.indexOf(line[this.filter]) == -1 ) {
				data += ',"'+line[this.filter]+'"';
				this.xref.push (line[this.filter]);
			}
		}
   	};
   	this._lastline = lines[lines.length-1];
   	this.push (data);
	done();
}



XRef.prototype._flush = function (done) {
	this.push (this._lastline+"]");
	done();
}