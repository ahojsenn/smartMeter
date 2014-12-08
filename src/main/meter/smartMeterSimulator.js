#!/usr/bin/env node
/*jslint node: true */
/*
 	Johannes Mainusch, 2014-02-25
	the Data Simulator is now in this seperate file...
*/
var global = require ('../global/global.js').init("smartMetersimulator");


/*
 * a random data generator which may be used in dev-mode
 *
 */
function simulator () {
	// set timer intervall
	var exec = require('child_process').exec;

	// milliSekundenProUmdrehung: the time it takes for one blink or turn of the meter
	// kWhProUmdrehung = 1 / UmdrehungProKWh
	// wattSekundeProUmdrehung = kWhProUmdrehung * 1000 / 3600
	// sekundeProUmdrehung = milliSekundenProUmdrehung / 1000
	// watt = wattSekundeProUmdrehung / SekundeProUmdrehung
	//
	this.writeSimulatedData = function (milliSekundenProUmdrehung) {
		var kWhProUmdrehung = 1 / global.UmdrehungenProKWh,
			wattSekundeProUmdrehung = kWhProUmdrehung * 1000*3600,
			sekundeProUmdrehung = milliSekundenProUmdrehung/1000,
			watt = wattSekundeProUmdrehung / sekundeProUmdrehung,
			cmd = "echo {'\"'test1'\"' : '\"'simulatedData'\"', '\"'Watt'\"' : "+watt+", '\"'timestamp'\"': `date +%s000`} >> "+ global.datafilename;
		global.log('  createRandomData created 1/75 KW/h after '+ milliSekundenProUmdrehung/1000 + 's. Watt= ' + watt);
		global.log('  logged it to: '+ global.datafilename);
		exec (cmd);
	}

	// create an entry in the datafile at random time between 0-10s intervalls
	this.createRandomData = function  () {
		var randomTime = 1000+Math.round(1000*Math.random()), // something between 3 and 4 seconds
			objref = this;
		global.log ("in createRandomData...");

		setTimeout(function () {
			global.log("time passed..." + randomTime + "s");
			objref.writeSimulatedData (randomTime);
			objref.createRandomData();
		}, randomTime);
	};
}


global.log ("starting simulator...");
var mysimulator = new simulator ();
mysimulator.createRandomData();





