#!/usr/bin/env node
/*jslint node: true */
/*
	Johannes Mainusch
	Start: 20150208
*/
module.exports = Lines2JSON;
var util 		= require('util');
var stream 		= require('stream');
var Transform 	= stream.Transform;
var	global 	= global || require ("../../main/global/global.js").init("from DataBase");

function Lines2JSON (options) {
	// allow use without new
  	if (!(this instanceof Lines2JSON)) {return new Lines2JSON(options); }
 	//
  	// init Transform
  	Transform.call(this, options);
	this._lastline = "";
	this._first = true;
}
util.inherits(Lines2JSON, Transform);


Lines2JSON.prototype._transform = function (chunk, encoding, done) {
	global.log ("in Lines2JSON_transform, got chunk..., this._lastline="+this._lastline);
	var lines = chunk.toString().split("\n"),
		self = this,
		data = "";
	//
	for (var i=0; i< lines.length-1; i++) {
		var line = lines[i];
		if (this._first) {
			this._first = false;
			data += "["+line+"\n";
		}
   		else if (i==0)
   			data += ","+this._lastline+line+"\n";
   		else
   			data += ","+line+"\n";
   	};
   	this._lastline = lines[lines.length-1];
//		global.log ("Lines2JSON.prototype._transform: >>>>>>> ... "+data);
   	this.push (data);
	done();
}


Lines2JSON.prototype._flush = function (done) {
//	global.log ("Lines2JSON.prototype._flush: >>>>>>> ... "+this._lastline);
	this.push (this._lastline+"]");
	done();
}