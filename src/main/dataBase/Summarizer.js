#!/usr/bin/env node
/*jslint node: true */
/*
	Johannes Mainusch
	Start: 20150416

	exspect options = {
				select	: [{name: "timestamp", regExp: "/\d{4}-\d{2}-\d{2}/"}]


                groupBy : "something like 'timestamp'",
				searchExp : /\d{4}-\d{2}-\d{2}/,
                average : "for example 'Watt'"
            }
*/
module.exports = Summarizer;
var util 		= require('util');
var stream 		= require('stream');
var Transform 	= stream.Transform;
var	global 		= global || require ("../../main/global/global.js").init("from DataBase");


function Summarizer (options) {
	// allow use without new
  	if (!(this instanceof Summarizer)) {return new Summarizer(options); }
 	//
  	// init Transform
  	Transform.call(this, options);
  	this._options 	= options;
  	this._result	= {"gdata" : {} };
	this._first 	= true;
	this._chunkRest = "";
	global.log ("in function Summarizer: group by '" + options['groupBy']+"'");
}
util.inherits(Summarizer, Transform);


Summarizer.prototype._transform = function (chunk, encoding, done) {
	//global.log ("--> "+this._chunkRest+chunk);
	// we got to split chunk in lines...
	var lines = (this._chunkRest+chunk.toString()).split ("\n");
	for (var i = 0; i < lines.length-1; i++) {
		//global.log (i + "  " + lines[i]);
		averageData (this, JSON.parse( lines[i] ));
	}
	this._chunkRest = lines[i];
	done();
}



function averageData (self, data) {
	//global.log ("... in averageData " + data[self._options['groupBy']]);

 	var group 	= data[self._options['groupBy']],
 		value 	= data[self._options['average']],
 		soup 	= new Array();

 	// THIS IS A TEST RIGHT NOW...
 	self._options['select'].map (function (sel) {
 		// select from data and use regexp.
 		if (sel.regExp) {
	 		//global.log ("--> " + sel.name + ":" + data[sel.name].match(sel.regExp) );
		 	//soup.push( data[sel.name].match(sel.regExp) );
		}
 		else {
	 		global.log ("--> " + sel.name + ":" + data[sel.name] );
		 	soup.push ( data[sel.name] );
 		}
 		global.log ("--> " + JSON.stringify(soup) );
 		// now fill the result structure
 		if (self._result.gdata[soup] == null) {
			self._result.gdata[soup] = {}
			self._result.gdata[soup].nEntries = 1;
			self._result.gdata[soup].sum = value;
			self._result.gdata[soup].sum2 = value*value;
 		}
 	} );


	self._nentries++;

	if (self._options['searchExp'] != null) {
		group = group.match(self._options['searchExp']);
		//global.log ("... group = "+group);
	}

	if ( group != null ) {
		if (self._first) {
			self._first= false;
			// global.log ("...first... "+ data.timestamp);
			self._result.first = data.timestamp;
		}
		if ( self._result.gdata[group] == null) {
			self._result.gdata[group] = {}
			self._result.gdata[group].nEntries = 1;
			self._result.gdata[group].sum = value;
			self._result.gdata[group].sum2 = value*value;
		} else {
			self._result.gdata[group].nEntries++;
			self._result.gdata[group].sum 	+= value;
			self._result.gdata[group].sum2 += value*value;
		}
		self._result.last = data.timestamp;
	}
}


Summarizer.prototype._flush = function (done) {
	for (var group in this._result.gdata) {
		this._result.gdata[group].average = this._result.gdata[group].sum / this._result.gdata[group].nEntries;
		this._result.gdata[group].rms     = Math.sqrt( this._result.gdata[group].sum2 / this._result.gdata[group].nEntries);
	}
	this.push (JSON.stringify(this._result));
	if (process.argv[2]  != null && process.argv[2] === "-p") console.log (JSON.stringify(this._result));
	done();
}


// print process.argv
// this is for when being called by the command line
if ( process.argv[2]  != null && process.argv[2] === "-p") {
	var summarizer = new Summarizer ({
				"select" 	: [ {"name": "timestamp", "regExp": /\d{4}-\d{2}-\d{2}/},
								{"name": "term"}],
                "groupBy" 	: "timestamp",
                "searchExp" : /\d{4}-\d{2}-\d{2}/,
              	"average" 	: "Watt" });

	process
		.stdin
		.pipe (summarizer);
}

