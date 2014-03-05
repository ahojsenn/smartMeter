#!/usr/bin/env node
/*jslint node: true */
/*
 	Johannes Mainusch, 2014-02-25
	the Data Simulator is now in this seperate file...
*/
var global = require ('../global/global.js');


/*
 * initialize function for the smarty 
 */
function _Init () {
	var objref = this,
		params = require ('./smartMeter.json') ,
		fs =  require('fs');


	// Simple constructor, links all parameters in params object to >>this<<
	if (params && Object.keys && Object.keys(params).length >= 1) {
		global.log ("initializing this smarty with params");
		Object.keys(params).forEach( function(param) {
			objref[param] = params[param];
			global.log ("setting this."+param+"="+ params[param]);
		})
	}

	return this; 
}


/*
 * a random data generator which may be used in dev-mode
 *
 */
function simulator () {
	// set timer intervall
	var exec = require('child_process').exec;

	// create an entry in the datafile at random time between 0-10s intervalls
	this.createRandomData = function  () {
		var randomTime = Math.round(1000*Math.random()), // something between 0 and 10 seconds
			objref = this;
		global.log ("in createRandomData...");

		setTimeout(function () {
			var watt=Math.round(86400/(75*randomTime/1000)),
				cmd = "echo {'\"'test1'\"' : '\"'huhuh'\"', '\"'Watt'\"' : "+watt+", '\"'timestamp'\"': `date +%s000`} >> "+ global.datafilename;
			global.log('  createRandomData created 1/75 KW/h after '+ randomTime/1000 + 's. Watt= ' + watt);
			global.log('  logged it to: '+ global.datafilename);
			exec (cmd);
			objref.createRandomData();
		}, randomTime);
	};
}



global.log ("starting simulator...");
var mysimulator = new simulator ();
mysimulator.createRandomData();





