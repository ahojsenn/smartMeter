#!/usr/bin/env node
/*jslint node: true */
/*
	Johannes Mainusch
	Start: 20150416
*/
module.exports  = Lines2JSONAtoms;
var util 		= require('util');
var stream 		= require('stream');
var Transform 	= stream.Transform;
var	global 	    = global || require ("../../main/global/global.js").init("from DataBase");

function Lines2JSONAtoms (options) {
	// allow use without new
  	if (!(this instanceof Lines2JSONAtoms)) {return new Lines2JSONAtoms(options); }
 	//
  	// init Transform
  	Transform.call(this, options);
	this._lastline = "";
	this._first = true;
}
util.inherits(Lines2JSONAtoms, Transform);


Lines2JSONAtoms.prototype._transform = function (chunk, encoding, done) {
	var lines = chunk.toString().split("\n");
	//
	for (var i=0; i< lines.length-1; i++) {
		var line = lines[i];
		if (this._first) {
			this._first = false;
			this.push(line);
		}
   		else if (i==0)
   			this.push(this._lastline+line);
   		else
   			this.push(line);
   	};
   	this._lastline = lines[lines.length-1];
//		global.log ("Lines2JSONAtoms.prototype._transform: >>>>>>> ... "+data);
	done();
}


Lines2JSONAtoms.prototype._flush = function (done) {
//	global.log ("Lines2JSONAtoms.prototype._flush: >>>>>>> ... "+this._lastline);
	this.push (this._lastline);
	done();
}