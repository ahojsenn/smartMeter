#!/usr/bin/env node
/*jslint node: true */
/*
 	Johannes Mainusch, 2013-02-26
 	The purpose of this programm is to support my energy meter reader by recording ttimestamps,
	whenever the reader notices the red mark on my energy meter. This happens every 1/75 KW/hour.

	The connected hardware consists of a prhototransistor, an IR-LED and a Schmitt-Trigger which fires
	on (infrared) light in the prototransistor.

	The signal input on the raspberry is GPIO PIN gpioInputPin, the polling intervall is defined by
	polling_intervall.

	The resuting timestamps are logges in the logfile...

*/
var global = require ('../global/global.js').init("from smartMeter"),
	setupGPIO = require ('./setupGPIO.js'),
	DataBase =  require ("../../main/dataBase/dataBase.js"),
	dataBase = new DataBase;

var smartMeter = function () {
		objref = this;
		this.init = function (i) {
			objref.gpioInputPin = global.measurements[i].gpioInputPin;
			objref.gpioIdentifier = global.measurements[i].gpioIdentifier;
			objref.gpioSimulatorTimeout = global.measurements[i].gpioSimulatorTimeout;
			objref.UmdrehungenProKWh = global.measurements[i].UmdrehungenProKWh;
			objref.EuroCentProKWh = global.measurements[i].EuroCentProKWh;
			global.log ("in smartMeter.init, initialized!");
			global.log ("                    gpioInputPin="+objref.gpioInputPin);
			return objref;
		};

		//this.powerConsumption = function (t1,t2,u) {powerConsumption (t1,t2,u)};

		this.lastValue = "start";
		this.lastTimestamp = 0;
		this.secondLastTimestamp = 0;
		return this;
	},
	measurements = new Array();

//
// a function to calculate ower consumption of my power meter...
// t1 and t2 are timestamps...
//
smartMeter.prototype.powerConsumption = function powerConsumption (t1, t2, UmdrehungenProKWh) {
	var myWatt = 1,  // set myWatt to 1 rather than 0, that will allow me to have a log scale later...
		UmdrehungenProh = 1000 * 3600	 / (t1 - t2),
		message = '';

	if (t2 > 0 )
		myWatt = 1000* UmdrehungenProh / UmdrehungenProKWh ;

	global.log("in powerConsumption ("
		+ (t1-t2)/1000 +"s passed, "+ UmdrehungenProKWh + "), "
		+"UmdrehungenProh="+Math.round(1000*UmdrehungenProh)/1000 +", "
		+"Watt="+myWatt);


	return myWatt;
}





//
// reads the inpup of the GPIO by polling
// since I didn't get the onchange to run...
//
smartMeter.prototype.readFromGPIO = function readFromGPIO(callback) {
	var fs = require('fs'),
		date = new Date(),
		timestamp,
		message="",
		watts = 0,
		objref = this;

	message += '{';
	message += '"term":"'+global.location+'.'+ objref.gpioIdentifier+'"';

	fs.readFile (	global.gpio_path+'gpio'+objref.gpioInputPin+'/value',
					function(err, inputValue) {
		if(err) {
	        console.log(err);
//	        return err;
	    }
	    else {
			if (objref.lastValue+0 != inputValue+0 ) {  // pin changed
				global.log ("in readFromGPIO, pin changed, inputValue="+inputValue);
				objref.lastValue = inputValue;
				timestamp = date.getTime();
				watts = objref.powerConsumption	(	timestamp,
													objref.secondLastTimestamp,
													objref.UmdrehungenProKWh);
				message += ', "Watt":'+watts;
				message += ', "timestamp":' + timestamp;
				message += '}';

				// only trigger to log stuff,
				// if there is a significant power consumption,
				// i.e. not at startup or reboot time
				if (watts > 1)
					dataBase.writeData (message);

				objref.secondLastTimestamp = objref.lastTimestamp;
				objref.lastTimestamp = timestamp;
			}
			global.timers.setTimeout (
				function () {objref.readFromGPIO()},
				global.polling_intervall);
		}
	});
	if (typeof callback === 'function' && callback());
	return objref;
}


module.exports = smartMeter;

/*
 * The main bit...
 */
setupGPIO ('readyForMeasurement')

/*
 * after setup, i.e. .on('readyForMeasurement', I will start one
 * smartmeter per configured measurement in globalParameters*.json
 */
global.eventEmitter
	.on('readyForMeasurement', function () {
		/*
		 * loop through the configured input pins
 		 */
		for (var i in global.measurements) {
			var sm =  new smartMeter();
			sm.init(i);
			measurements.push (sm);
			global.log ("starting the smartmeter on pin="+sm.gpioInputPin);
			global.log ("                             i="+i);
			global.log ("           with gpioIdentifier="+sm.gpioIdentifier);
			sm.readFromGPIO ();
		}
	});
/* The End */