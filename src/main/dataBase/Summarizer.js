#!/usr/bin/env node
/*jslint node: true */
/*
	Johannes Mainusch
	Start: 20150416

	exspect options = {
                groupBy : "something like 'term'",
                average : "for example 'Watt'"
            }
*/
module.exports = Summarizer;
var util 		= require('util');
var stream 		= require('stream');
var Transform 	= stream.Transform;
var	global 	= global || require ("../../main/global/global.js").init("from DataBase");

function Summarizer (options) {
	// allow use without new
  	if (!(this instanceof Summarizer)) {return new Summarizer(options); }
 	//
  	// init Transform
  	Transform.call(this, options);
  	this._options 	= options;
  	this._firstTs 	= "";
  	this._average 	= 0;
  	this._nentries 	= 0;
  	this._result	= {"groups" : {} };
	this._first 	= true;
	global.log ("in function Summarizer: group by '" + options['groupBy']+"'");
}
util.inherits(Summarizer, Transform);


Summarizer.prototype._transform = function (chunk, encoding, done) {
//	global.log ("in Summarizer: " + chunk );
//
//   ==> hier muss ich ein line by line split in den stream einbauen.... :-)
 	var group = JSON.parse(chunk)[this._options['groupBy']],
		value = JSON.parse(chunk)[this._options['average']];
	this._nentries++;
//	global.log ("in Summarizer: " + group + "  "+ value );

	if ( group != null ) {
		if (this._first) {
			this._first= false;
			global.log ("...first... "+ JSON.parse(chunk).timestamp);
			this._result.first = JSON.parse(chunk).timestamp;
		}
		if ( this._result.groups[group] == null) {
			this._result.groups[group] = {}
			this._result.groups[group].nEntries = 1;
			this._result.groups[group].sum = value;
		} else {
			this._result.groups[group].nEntries++;
			this._result.groups[group].sum 	+= value;
		}
//		global.log ("    ... "+ this._result[group].nEntries +"  " +this._result[group].sum );
		this._result.last = JSON.parse(chunk).timestamp;

	}
	done();
}


Summarizer.prototype._flush = function (done) {
	global.log ("Summarizer.prototype._flush: >>>>>>> ... "+this._options.average);
	for (var group in this._result.groups) {
//		global.log ("Summarizer.prototype._flush: found group " + group);
		this._result.groups[group].average = this._result.groups[group].sum / this._result.groups[group].nEntries;
	}
	this.push (JSON.stringify(this._result));
	if (process.argv[2]  != null && process.argv[2] === "-p") console.log (JSON.stringify(this._result));
	done();
}

// print process.argv
if (process.argv[2]  != null && process.argv[2] === "-p") {
	var options = {
                "groupBy" : "term",
                "average" : "Watt"
            },
        summarizer = new Summarizer (options);
	process
		.stdin
		.pipe (summarizer);
}

