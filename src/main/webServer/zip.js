#!/usr/bin/env node
/*jslint node: true */
/*
	Johannes Mainusch
	Start: 20150213
*/

module.exports 	= Zip;
var util 		= require('util');
var stream 		= require('stream');
var Transform 	= stream.Transform;
var	global 		= global || require ("../../main/global/global.js").init("from DataBase");



function Zip (request, response, options) {
	//  according to http://en.wikipedia.org/wiki/HTTP_compression
	// the compression has to ba done before sending the result. 
	// I will collect the data in this.dataTank before comression...
	//
	this.dataTank = [];
//	global.log ("in Zip..., request.headers="+request.headers['accept-encoding']);
	if (!(this instanceof Zip)) {return new Zip(request, response, options); }
  	// init Transform
	if (!options) options = {}; // ensure object
  	options.objectMode = true; // forcing object mode
  	Transform.call(this, options);
	this.acceptEncoding = request.headers['accept-encoding'] || '';
  	// Note: this is not a conformant accept-encoding parser.
  	// See http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.3
  	if (this.acceptEncoding.match(/\bgzip\b/)) {
//	  	global.log ("in Zip ..., about to write head, gzip");
    	response.writeHead(200, { 'content-encoding': 'gzip' });
  	} else if (this.acceptEncoding.match(/\bdeflate\b/)) {
//	  	global.log ("in Zip ..., about to write head, deflate");
    	response.writeHead(200, { 'content-encoding': 'deflate' });
  	} else {
		this.acceptEncoding = '';
    	response.writeHead(200, {});
  	}
}
util.inherits(Zip, Transform);



Zip.prototype._transform = function (chunk, encoding, done) {
//  	global.log ("in Zip._transform ...");
	if (this.acceptEncoding == '') {
//	  	global.log ("in Zip._transform ..., pushing chunk");
		this.push (chunk);
	} else {
//	  	global.log ("in Zip._transform ..., tanking data");
		this.dataTank.push(chunk);
	}
	done();
}



Zip.prototype._flush = function (done) {
	var zlib = require('zlib'),
		self = this;
//	global.log ("\nin Zip..., pushypushy done, this.dataTank="+this.dataTank.join(''));
//	global.log ("in zippyzippy, zlib.Z_DEFAULT_COMPRESSION="+zlib.Z_DEFAULT_COMPRESSION);
  	if (this.acceptEncoding.match(/\bgzip\b/)) {
    	zlib.gzip (
    		this.dataTank.join(''),
    		function (error, result){
    			if (error)
    				error.log("ERROR in zlib.gzip: "+error)
    			else
	    			self.push(result);
				done();
    		});
  	} else if (this.acceptEncoding.match(/\bdeflate\b/)) {
    	zlib.deflate (
    		this.dataTank.join(''),
    		function (error, result){
    			if (error)
    				error.log("ERROR in zlib.deflate: "+error)
    			else
	    			self.push(result);
				done();
    		});
  	} else {
// 	  	global.log ("in Zip ...flushed plain");
		done();
  	}
}

