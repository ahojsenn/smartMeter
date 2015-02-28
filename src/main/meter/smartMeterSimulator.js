#!/usr/bin/env node
/*jslint node: true */
/*
 	Johannes Mainusch, 2014-02-25
	the Data Simulator is now in this seperate file...
*/
var global = require ('../global/global.js').init("smartMetersimulator");
var mySimulator = new Array;

module.exports = mySimulator;

/*
 * a random data generator which may be used in dev-mode
 *
 */
function simulator (gpioNr) {
	// set timer intervall
	var exec = require('child_process').exec,
		gpioPin=global.measurements[gpioNr].gpioInputPin,
		gpioIdentifier=global.measurements[gpioNr].gpioIdentifier,
		UmdrehungenProKWh=global.measurements[gpioNr].UmdrehungenProKWh,
		EuroCentProKWh=global.measurements[gpioNr].EuroCentProKWh;

	this.stop = false;

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

	this.flipPinOnGPIO = function (gpioNr) {
		var path = global.gpio_path+"gpio"
				  +global.measurements[gpioNr].gpioInputPin+"/value",
			fs = require('fs'),
			pin;

		global.log ("smartMeterSimulator: in flipPinOnGPIO");

		fs.readFile(path, "binary", function (err, pin) {
			var flippedPin= 1 - pin;
			global.log ('	readFile: ' +path+ " pin="+pin);
			if (err) {
				global.log ('smartMeterSimulator: ERROR readFile: ' + './client/' + myfilename);
		    	return;
			}
			fs.writeFile (path, flippedPin, function (err) {
				global.log ('	write flipped pin: ' +path+ " flippedPin="+flippedPin);
				if (err) {
					global.log ('smartMeterSimulator: ERROR readFile: ' + './client/' + myfilename);
		    		return;
		    	}
			})
		})
	}

	// create an entry in the datafile at random time between 0-10s intervalls
	this.createRandomData = function  (gpioNr) {
		var timeout = global.measurements[gpioNr].gpioSimulatorTimeout,
			randomTime = timeout+Math.round(1000*Math.random()), // something between 3 and 4 seconds
			objref = this;
		global.log ("smartMeterSimulator: in createRandomData..., timeout="+timeout);

		if (!this.stop)
			setTimeout(function () {
				global.log("time passed..." + randomTime + "s");
				//objref.writeSimulatedData (randomTime);
				objref.flipPinOnGPIO(gpioNr);
				objref.createRandomData(gpioNr);
			}, randomTime);
	};

	this.stopSimulator = function () {
		this.stop = true;
	};

	return this;
}


global.log ("starting simulator...");

for (var i in global.measurements) {
	mySimulator[i] = new simulator (i);
	mySimulator[i].createRandomData(i);
}






