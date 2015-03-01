#!/usr/bin/env node
/*jslint node: true */
/*
	Johannes Mainusch
	Start: 20150228
*/
module.exports = WrapWithCallback;

var util 		= require('util');
var stream 		= require('stream');
var Transform 	= stream.Transform;
var	global 	= global || require ("../../main/global/global.js").init("from WrapWithCallback");

function WrapWithCallback (cbName, options) {
	// allow use without new
  	if (!(this instanceof WrapWithCallback)) {return new WrapWithCallback(cbName, options); }
 	//
  	// init Transform
  	Transform.call(this, options);
	this._lastline = "";
	this._first = true;
	this.cbName = cbName;
}
util.inherits(WrapWithCallback, Transform);

WrapWithCallback.prototype._transform = function (chunk, encoding, done) {
	if ( (this.cbName != '' ) && this._first) {
	   	this.push ( this.cbName + "(" + chunk);
		this._first = false;
	}
	else
		this.push(chunk);
	done();
}

WrapWithCallback.prototype._flush = function (done) {
	if ( this.cbName != '' )
		this.push(')');
	done();
}