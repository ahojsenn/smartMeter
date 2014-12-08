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

var testmode = require("../../main/global/testmode.js");

var	global = (typeof global != 'undefined' ) ? global :
	{
		timers: require('timers'),
		eventEmitter: new (require('events').EventEmitter),
		//          diese ^ Klammern versteh ich  nicht  ^
		init: 	_Init,
		log: 	function log (s) {
					if (this.debug==true)  console.log(s);
					return this;
				}
	}

module.exports = global;

/*
 * initialize function for the smartMeters global object
 */
function _Init (callerId) {
	var globalParameters,
		parameterFileName,
		fs   = require('fs'),
		path = require('path');

	global.log ("in global.init, got called from "+ callerId);
	if (process.platform == 'darwin')
		parameterFileName = './globalParametersOnDarwin.json';
	else
		if  ( testmode.isSwitchedOn() )
			parameterFileName = './globalParametersOnTest.json'
		else
			parameterFileName = './globalParameters.json';
	globalParameters = require (parameterFileName);


	// Simple constructor, links all parameters in globalParameters object to global
	if (globalParameters && Object.keys && Object.keys(globalParameters).length >= 1) {
		global.log ("initializing this smartMeter with " + parameterFileName);
		Object.keys(globalParameters).forEach( function(param) {
			global[param] = globalParameters[param];
		})
	}

	// create dataPath and dataFile if it does not exist
	if (!fs.existsSync( path.dirname(global.datafilename) )) {
		fs.mkdirSync( path.dirname(global.datafilename) );
	}
	if (!fs.existsSync(global.datafilename)) {
		fs.openSync(global.datafilename, 'a');
	}

	global.eventEmitter.emit('initializedGlobalObject');
	return global;
}





