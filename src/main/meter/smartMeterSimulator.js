#!/usr/bin/env node
/*jslint node: true */
/*
 	Johannes Mainusch, 2014-02-25
	the Data Simulator is now in this seperate file...
*/
var global = require ('../global/global.js').init("smartMetersimulator");
var mySimulator = new Array;


/*
 * a random data generator which may be used in dev-mode
 *
 */
function simulator (gpioNr) {
	// set timer intervall
	var exec = require('child_process').exec,
		gpioPin=global.gpio_input_pin[gpioNr],
		gpioIdentifier=global.gpioIdentifier[gpioNr],
		UmdrehungenProKWh=global.UmdrehungenProKWh[gpioNr],
		EuroCentProKWh=global.EuroCentProKWh[gpioNr];

	// milliSekundenProUmdrehung: the time it takes for one blink or turn of the meter
	// kWhProUmdrehung = 1 / UmdrehungProKWh
	// wattSekundeProUmdrehung = kWhProUmdrehung * 1000 / 3600
	// sekundeProUmdrehung = milliSekundenProUmdrehung / 1000
	// watt = wattSekundeProUmdrehung / SekundeProUmdrehung
	//
	this.writeSimulatedData = function (milliSekundenProUmdrehung) {
		var kWhProUmdrehung = 1 / UmdrehungenProKWh,
			wattSekundeProUmdrehung = kWhProUmdrehung * 1000*3600,
			sekundeProUmdrehung = milliSekundenProUmdrehung/1000,
			watt = wattSekundeProUmdrehung / sekundeProUmdrehung,
			cmd = "echo {'\"'term'\"' : '\"'"+gpioIdentifier+"'\"', '\"'Watt'\"' : "+watt+", '\"'timestamp'\"': `date +%s000`} >> "+ global.datafilename;
		global.log('  createRandomData created entry after '+ milliSekundenProUmdrehung/1000 + 's. Watt= ' + watt);
		global.log('  logged it to: '+ global.datafilename);
		exec (cmd);
	}

	// create an entry in the datafile at random time between 0-10s intervalls
	this.createRandomData = function  (gpioNr) {
		var timeout = global.gpioSimulatorTimeout[gpioNr],
			randomTime = timeout+Math.round(1000*Math.random()), // something between 3 and 4 seconds
			objref = this;
		global.log ("in createRandomData..., timeout="+timeout);

		setTimeout(function () {
			global.log("time passed..." + randomTime + "s");
			objref.writeSimulatedData (randomTime);
			objref.createRandomData(gpioNr);
		}, randomTime);
	};

	return this;
}


global.log ("starting simulator...");

for (var gpioNr=0; gpioNr<global.gpio_input_pin.length; gpioNr++) {
	mySimulator[gpioNr] = new simulator (gpioNr);
	mySimulator[gpioNr].createRandomData(gpioNr);
}






