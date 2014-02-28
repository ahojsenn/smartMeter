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
var global = require ('./global.js');

var global = {
	timers: require('timers'),
	eventEmitter: new (require('events').EventEmitter),
	//          diese ^ Klammern versteh ich  nicht  ^
	// util.inspect ansehen

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
function _Init () {
	var objref = this,
		params = (process.platform == 'darwin') ? 
			require ('./globalDarwin.json') 
		   :require ('./global.json');

	// Simple constructor, links all parameters in params object to >>this<<
	if (params && Object.keys && Object.keys(params).length >= 1) {
		global.log ("initializing this smarty with params");
		Object.keys(params).forEach( function(param) {
			objref[param] = params[param];
			global.log ("setting this."+param+"="+ params[param]);
		})
	}
	console.log ("initialized global object...");
	return this; 
}

global.init();






