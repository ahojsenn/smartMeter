#!/usr/bin/env node
/*jslint node: true */
/*
 	Johannes Mainusch, 2013-02-26
 	The purpose of this programm is to support my energy meter reader by recording ttimestamps,
	whenever the reader notices the red mark on my energy meter. This happens every 1/75 KW/hour.
	
	The connected hardware consists of a prhototransistor, an IR-LED and a Schmitt-Trigger which fires
	on (infrared) light in the prototransistor.
	
	The signal input on the raspberry is GPIO PIN gpio_input_pin, the polling intervall is defined by 
	polling_intervall.
	
	The resuting timestamps are logges in the logfile...
*/

var testmode = require("../../main/global/testmode.js"),
	global = (typeof global != 'undefined' ) ? global : 
	{
	timers: require('timers'),
	eE: new (require('events').EventEmitter),
	//          diese ^ Klammern versteh ich  nicht  ^

	init: _Init,
	log: function log (s) { 
		if (this.debug==true)  console.log(s);
		return this;
	}
}

module.exports = global;

/*
 * initialize function for the smarty 
 */
function _Init (gotCalledWith) {
	var objref = this,
		params = require ('./config.json'),
		fs =  require('fs'),
		path = require('path'),
		logP;

	if (process.platform == 'darwin')
		params = require ('./configTestDarwin.json');
	else if  ( testmode.isSwitchedOn() )
		params = require ('./configTest.json');

	// Simple constructor, links all parameters in params object to >>this<<
	if (params && Object.keys && Object.keys(params).length >= 1) {
		global.log ("initializing this smarty with params: " );
		Object.keys(params).forEach( function(param) {
			objref[param] = params[param];
		})
	}

	logP = path.dirname(global.datafilename);

	// create logPath and logFile if it does not exist
	if (!fs.existsSync(logP)) {
		fs.mkdirSync(logP);
	}
	if (!fs.existsSync(global.datafilename)) {
		fs.openSync(global.datafilename, 'a');
	}

	global.eE.emit('initializedGlobalObject');
	return this; 
}





